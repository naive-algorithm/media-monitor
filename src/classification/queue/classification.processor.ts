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

@Processor(ARTICLE_CLASSIFICATION_QUEUE_NAME, {
  concurrency: 1,
  autorun: false,
})
export class ClassificationProcessor
  extends WorkerHost
  implements BeforeApplicationShutdown
{
  private readonly logger = new Logger(ClassificationProcessor.name);
  constructor(private readonly classificationService: ClassificationService) {
    super();
  }

  async process(
    job: Job<ClassifyArticleJobData>,
  ): Promise<ArticleClassifierResult> {
    const startedAt = performance.now();
    const context = {
      jobId: job.id,
      articleId: job.data.articleId,
      classifierVersion: job.data.classifierVersion,
      attempt: job.attemptsStarted,
    };
    try {
      if (job.name !== ARTICLE_CLASSIFICATION_JOB_NAME) {
        throw new UnrecoverableError(`Unknown job type: ${job.name}`);
      }

      const { articleId, classifierVersion } = job.data;

      if (classifierVersion !== TARGET_CLASSIFIER_VERSION) {
        throw new UnrecoverableError(
          `Classifier version: ${classifierVersion} doesn't match current classifier version: ${TARGET_CLASSIFIER_VERSION}`,
        );
      }

      const classificationResult =
        await this.classificationService.classifyArticle(articleId);

      this.logger.log(
        formatLogMessage("Classification succeeded", {
          ...context,
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
      this.logger.error(
        formatLogMessage("Classification attempt failed", {
          ...context,
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
