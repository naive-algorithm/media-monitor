import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { formatLogMessage } from "src/common/logging/format-log-message";
import {
  ARTICLE_CLASSIFICATION_QUEUE_NAME,
  ARTICLE_CLASSIFICATION_JOB_NAME,
} from "./classification.constants";
import {
  BeforeApplicationShutdown,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ClassificationService } from "../classification.service";
import { Job, UnrecoverableError } from "bullmq";
import { ClassifyArticleJobData } from "./classify-article-job.types";
import { TARGET_CLASSIFIER_VERSION } from "../classification.config";
import { ArticleClassifierResult } from "../classification.types";
import { ArticleClassificationError } from "../errors/article-classification.error";
import { ClassificationRunsService } from "../runs/classification-runs.service";
import type {
  FinishClassificationRunInput,
  StartClassificationRunInput,
} from "../runs/classification-runs.types";

@Processor(ARTICLE_CLASSIFICATION_QUEUE_NAME, {
  concurrency: 1,
  autorun: false,
})
export class ClassificationProcessor
  extends WorkerHost
  implements BeforeApplicationShutdown
{
  private readonly logger = new Logger(ClassificationProcessor.name);
  constructor(
    private readonly classificationService: ClassificationService,
    private readonly classificationRunsService: ClassificationRunsService,
  ) {
    super();
  }

  async process(
    job: Job<ClassifyArticleJobData>,
  ): Promise<ArticleClassifierResult> {
    if (job.id === undefined) {
      throw new UnrecoverableError("Classification job ID is not provided");
    }

    if (job.name !== ARTICLE_CLASSIFICATION_JOB_NAME) {
      throw new UnrecoverableError(`Unknown job type: ${job.name}`);
    }

    const { articleId, classifierVersion } = job.data;

    if (classifierVersion !== TARGET_CLASSIFIER_VERSION) {
      throw new UnrecoverableError(
        `Classifier version: ${classifierVersion} doesn't match the current classifier version: ${TARGET_CLASSIFIER_VERSION}`,
      );
    }

    const startedAt = performance.now();

    const context = {
      jobId: job.id,
      articleId: job.data.articleId,
      classifierVersion: job.data.classifierVersion,
      attempt: job.attemptsStarted,
    };

    const runId = await this.recordRunStart(context);

    try {
      const classificationResult =
        await this.classificationService.classifyArticle(articleId);

      await this.tryRecordRunFinish(runId, {
        status: "SUCCESS",
        classificationStatus: classificationResult.status,
      });

      this.logger.log(
        formatLogMessage("Classification succeeded", {
          ...context,
          runId,
          status: classificationResult.status,
          topicCount:
            classificationResult.status === "CLASSIFIED"
              ? classificationResult.topics.length
              : 0,
          durationMs: Math.round(performance.now() - startedAt),
        }),
      );
      return classificationResult;
    } catch (error: unknown) {
      if (error instanceof ArticleClassificationError) {
        await this.tryRecordRunFinish(runId, {
          status: "FAILED",
          failure: {
            stage: error.stage,
            reason: "exception",
            message:
              error.cause instanceof Error
                ? error.cause.message
                : String(error.cause),
          },
        });
      }

      this.logger.error(
        formatLogMessage("Classification attempt failed", {
          ...context,
          runId,
          stage:
            error instanceof ArticleClassificationError
              ? error.stage
              : undefined,
          durationMs: Math.round(performance.now() - startedAt),
          cause: error,
        }),
      );

      if (
        error instanceof ArticleClassificationError &&
        error.stage === "loading-article" &&
        error.cause instanceof NotFoundException
      ) {
        throw new UnrecoverableError(`Article ${job.data.articleId} not found`);
      }

      throw error;
    }
  }

  private async recordRunStart(
    input: StartClassificationRunInput,
  ): Promise<number> {
    try {
      return await this.classificationRunsService.recordRunStart(input);
    } catch (error: unknown) {
      this.logger.error(
        formatLogMessage("Failed to record classification run start", {
          ...input,
          cause: error,
        }),
      );

      throw error;
    }
  }

  private async tryRecordRunFinish(
    runId: number,
    outcome: FinishClassificationRunInput,
  ): Promise<void> {
    try {
      await this.classificationRunsService.recordRunFinish(runId, outcome);
    } catch (error: unknown) {
      this.logger.error(
        formatLogMessage("Failed to record classification run finish", {
          runId,
          status: outcome.status,
          cause: error,
        }),
      );
    }
  }

  @OnWorkerEvent("error")
  onWorkerError(error: Error): void {
    this.logger.error(
      formatLogMessage("Classification worker error", { cause: error }),
    );
  }

  async beforeApplicationShutdown(): Promise<void> {
    await this.worker.close();
  }
}
