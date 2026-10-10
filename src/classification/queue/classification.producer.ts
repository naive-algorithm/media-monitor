import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import type { Queue } from "bullmq";
import {
  ARTICLE_CLASSIFICATION_JOB_NAME,
  ARTICLE_CLASSIFICATION_QUEUE_NAME,
} from "./classification.constants";
import {
  ARTICLE_CLASSIFICATION_JOB_OPTIONS,
  CLASSIFICATION_BATCH_SIZE,
} from "./classification-queue.config";
import { ArticlesService } from "src/articles/articles.service";
import { TARGET_CLASSIFIER_VERSION } from "../classification.config";
import type { ClassifyArticleJobData } from "./classify-article-job.types";

@Injectable()
export class ClassificationProducer {
  constructor(
    @InjectQueue(ARTICLE_CLASSIFICATION_QUEUE_NAME)
    private readonly queue: Queue<ClassifyArticleJobData>,
    private readonly articlesService: ArticlesService,
  ) {}

  async enqueueArticleClassification(articleId: number): Promise<void> {
    await this.queue.add(
      ARTICLE_CLASSIFICATION_JOB_NAME,
      { articleId, classifierVersion: TARGET_CLASSIFIER_VERSION },
      {
        ...ARTICLE_CLASSIFICATION_JOB_OPTIONS,
        // Retained failed jobs block automatic re-enqueueing of this version.
        jobId: `article-${articleId}-v-${TARGET_CLASSIFIER_VERSION}`,
        deduplication: {
          id: `article-${articleId}-v-${TARGET_CLASSIFIER_VERSION}`,
        },
      },
    );
  }

  async enqueuePendingClassifications(): Promise<void> {
    const articleIds =
      await this.articlesService.findArticleIdsPendingClassification(
        TARGET_CLASSIFIER_VERSION,
        CLASSIFICATION_BATCH_SIZE,
      );

    for (const articleId of articleIds) {
      await this.enqueueArticleClassification(articleId);
    }
  }
}
