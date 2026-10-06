import {
  Injectable,
  OnApplicationShutdown,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { pipeline, env as transformersEnv } from "@huggingface/transformers";
import type { ZeroShotClassificationPipeline } from "@huggingface/transformers";
import { ArticleClassifier } from "../../article-classifier.abstract";
import {
  ClassificationResult,
  ClassificationInput,
} from "../../classification.types";

type ClassificationTaxonomy = {
  categories: Array<{ id: string; modelLabel: string }>;
};

const MODEL_ID = "MoritzLaurer/deberta-v3-base-zeroshot-v2.0";
const MODEL_REVISION = "8e7e5af5983a0ddb1a5b45a38b129ab69e2258e8";
const TOPIC_SCORE_THRESHOLD = 0.8;
const MAX_DESCRIPTION_LENGTH = 1200;
const CLASSIFIER_VERSION = "0.1.0";

@Injectable()
export class DebertaClassifierAdapter
  extends ArticleClassifier
  implements OnModuleInit, OnApplicationShutdown
{
  private busy = false;
  private closed = false;

  private classificationPipeline: ZeroShotClassificationPipeline | null = null;

  private topicIdByModelLabel: Map<string, string> | null = null;
  private taxonomyHash: string | null = null;

  constructor(private readonly config: ConfigService) {
    super();
  }

  async onModuleInit(): Promise<void> {
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
      {
        revision: MODEL_REVISION,
        dtype: "fp32",
        device: "cpu",
        session_options: { intraOpNumThreads: 1, interOpNumThreads: 1 },
      },
    );
  }

  async classify(input: ClassificationInput): Promise<ClassificationResult> {
    if (this.closed) {
      throw new Error("Classifier is closed");
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
        {
          multi_label: true,
          hypothesis_template: "This article is about {}.",
        },
      );

      if (Array.isArray(prediction)) {
        throw new Error("Expected a single classification result");
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
      throw new Error("Wait for the current classification before closing");
    }

    if (!this.closed) {
      this.closed = true;
      await this.classificationPipeline?.dispose();
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

  private prepareInput(input: ClassificationInput): {
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
