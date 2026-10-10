import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { formatLogMessage } from "src/common/logging/format-log-message";
import { pipeline, env as transformersEnv } from "@huggingface/transformers";
import type { ZeroShotClassificationPipeline } from "@huggingface/transformers";
import { ArticleClassifier } from "../../article-classifier.abstract";
import {
  ArticleClassifierResult,
  ArticleClassifierInput,
} from "../../classification.types";

import {
  MODEL_ID,
  MODEL_REVISION,
  MODEL_OPTIONS,
  CLASSIFIER_VERSION,
  CLASSIFICATION_OPTIONS,
  TOPIC_SCORE_THRESHOLD,
  MAX_DESCRIPTION_LENGTH,
} from "./deberta-classifier.config";

type ClassificationTaxonomy = {
  categories: Array<{ id: string; modelLabel: string }>;
};

@Injectable()
export class DebertaClassifierAdapter
  extends ArticleClassifier
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(DebertaClassifierAdapter.name);

  private busy = false;
  private closed = false;

  private classificationPipeline: ZeroShotClassificationPipeline | null = null;

  private topicIdByModelLabel: Map<string, string> | null = null;
  private taxonomyHash: string | null = null;

  constructor(private readonly config: ConfigService) {
    super();
  }

  async onModuleInit(): Promise<void> {
    const startedAt = performance.now();
    this.logger.log(
      formatLogMessage("Classifier initialization started", {
        model: MODEL_ID,
        revision: MODEL_REVISION,
      }),
    );

    const cacheDir = this.config.get<string>(
      "CLASSIFIER_CACHE_DIR",
      resolve(process.cwd(), ".cache", "models", "deberta"),
    );

    transformersEnv.cacheDir = cacheDir;
    transformersEnv.allowRemoteModels = false;

    await this.loadTaxonomy();

    this.classificationPipeline = await pipeline<"zero-shot-classification">(
      "zero-shot-classification",
      MODEL_ID,
      MODEL_OPTIONS,
    );

    this.logger.log(
      formatLogMessage("Classifier ready", {
        model: MODEL_ID,
        classifierVersion: CLASSIFIER_VERSION,
        durationMs: Math.round(performance.now() - startedAt),
      }),
    );
  }

  async classify(
    input: ArticleClassifierInput,
  ): Promise<ArticleClassifierResult> {
    if (this.closed) {
      throw new Error("Classifier is shutting down or has been closed");
    }
    if (this.busy) {
      throw new Error("Classifier accepts one article at a time");
    }

    const classificationPipeline = this.classificationPipeline;
    const topicIdByModelLabel = this.topicIdByModelLabel;

    if (classificationPipeline === null || topicIdByModelLabel === null) {
      throw new Error("Classifier is not initialized");
    }

    const article = this.prepareInput(input);

    this.busy = true;

    try {
      const prediction = await classificationPipeline(
        article.text,
        [...topicIdByModelLabel.keys()],
        CLASSIFICATION_OPTIONS,
      );

      if (Array.isArray(prediction)) {
        throw new Error("Expected a single classification result");
      }

      if (prediction.labels.length !== prediction.scores.length) {
        throw new Error("Model labels and scores must have matching lengths");
      }

      const scores = prediction.labels.map((label, index) => {
        const id = topicIdByModelLabel.get(label);
        const score = prediction.scores[index];
        if (!id || !Number.isFinite(score) || score < 0 || score > 1) {
          throw new Error("Unexpected model output");
        }
        return { id, score };
      });

      if (
        scores.length !== topicIdByModelLabel.size ||
        new Set(scores.map((s) => s.id)).size !== topicIdByModelLabel.size
      ) {
        throw new Error("Incomplete model output");
      }

      const topics = scores
        .filter(({ score }) => score >= TOPIC_SCORE_THRESHOLD)
        .map(({ id, score }) => ({
          topicCode: id,
          score,
        }));

      const [firstTopic, ...remainingTopics] = topics;

      if (firstTopic === undefined) {
        return {
          status: "UNCLASSIFIED",
          classifierVersion: CLASSIFIER_VERSION,
        };
      }

      return {
        status: "CLASSIFIED",
        topics: [firstTopic, ...remainingTopics],
        classifierVersion: CLASSIFIER_VERSION,
      };
    } finally {
      this.busy = false;
    }
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.busy) {
      throw new Error(
        "Cannot dispose classifier while classification is in progress",
      );
    }

    if (!this.closed) {
      // Reject new calls before asynchronous disposal begins. This flag does not
      // guarantee successful resource release if dispose() rejects.
      this.closed = true;

      if (this.classificationPipeline === null) {
        return;
      }

      this.logger.debug("Classifier resource disposal started");
      await this.classificationPipeline.dispose();
      this.classificationPipeline = null;
      this.logger.log("Classifier resources released");
    }
  }

  private async loadTaxonomy(): Promise<void> {
    const taxonomyPath = resolve(__dirname, "../../taxonomy/taxonomy.json");
    const taxonomyText = await readFile(taxonomyPath, "utf-8");
    // This bundled file is maintained with the application, not external input.
    const taxonomy = JSON.parse(taxonomyText) as ClassificationTaxonomy;

    this.taxonomyHash = this.calculateTaxonomyHash(taxonomyText);

    this.topicIdByModelLabel = new Map(
      taxonomy.categories.map((topic) => [topic.modelLabel, topic.id]),
    );
  }

  private calculateTaxonomyHash(taxonomyText: string): string {
    return createHash("sha256").update(taxonomyText).digest("hex");
  }

  private prepareInput(input: ArticleClassifierInput): {
    title: string;
    text: string;
  } {
    const title = input.title.trim();

    if (title.length === 0) {
      throw new TypeError("Article title must be a non-empty string");
    }

    const excerpt = (input.description ?? "").slice(0, MAX_DESCRIPTION_LENGTH);
    const text = `${title}\n${excerpt}`.trim();

    return { title, text };
  }
}
