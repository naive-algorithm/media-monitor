import { Test } from "@nestjs/testing";
import { getQueueToken } from "@nestjs/bullmq";
import { ArticlesService } from "src/articles/articles.service";
import { ClassificationProducer } from "./classification.producer";
import { TARGET_CLASSIFIER_VERSION } from "../classification.config";
import { CLASSIFICATION_BATCH_SIZE } from "./classification-queue.config";
import {
  ARTICLE_CLASSIFICATION_JOB_NAME,
  ARTICLE_CLASSIFICATION_QUEUE_NAME,
} from "./classification.constants";

// BullMQ's Nest integration is ESM. Unit tests replace only the queue DI
// boundary; queue behavior is not simulated or asserted here.
jest.mock("@nestjs/bullmq", () => {
  const { Inject } = jest.requireActual("@nestjs/common");
  const getQueueToken = (name: string) => `test-queue:${name}`;
  return {
    getQueueToken,
    InjectQueue: (name: string) => Inject(getQueueToken(name)),
  };
});

describe("ClassificationProducer", () => {
  let producer: ClassificationProducer;
  let add: jest.Mock;
  let findArticleIdsPendingClassification: jest.Mock;

  beforeEach(async () => {
    add = jest.fn().mockResolvedValue({});
    findArticleIdsPendingClassification = jest.fn().mockResolvedValue([7, 8]);
    const module = await Test.createTestingModule({
      providers: [
        ClassificationProducer,
        {
          provide: getQueueToken(ARTICLE_CLASSIFICATION_QUEUE_NAME),
          useValue: { add },
        },
        {
          provide: ArticlesService,
          useValue: { findArticleIdsPendingClassification },
        },
      ],
    }).compile();
    producer = module.get(ClassificationProducer);
  });

  it("uses the same version for selection, payload and deduplication", async () => {
    await producer.enqueuePendingClassifications();
    expect(findArticleIdsPendingClassification).toHaveBeenCalledWith(
      TARGET_CLASSIFIER_VERSION,
      CLASSIFICATION_BATCH_SIZE,
    );
    expect(add).toHaveBeenCalledTimes(2);
    for (const articleId of [7, 8]) {
      expect(add).toHaveBeenCalledWith(
        ARTICLE_CLASSIFICATION_JOB_NAME,
        { articleId, classifierVersion: TARGET_CLASSIFIER_VERSION },
        expect.objectContaining({
          jobId: `article-${articleId}-v-${TARGET_CLASSIFIER_VERSION}`,
          removeOnFail: false,
          deduplication: {
            id: `article-${articleId}-v-${TARGET_CLASSIFIER_VERSION}`,
          },
        }),
      );
    }
  });

  it("does not enqueue anything when no candidate exists", async () => {
    findArticleIdsPendingClassification.mockResolvedValueOnce([]);
    await producer.enqueuePendingClassifications();
    expect(add).not.toHaveBeenCalled();
  });

  it("propagates queue failure and stops the current batch", async () => {
    const cause = new Error("Redis unavailable");
    add.mockRejectedValueOnce(cause);
    await expect(producer.enqueuePendingClassifications()).rejects.toBe(cause);
    expect(add).toHaveBeenCalledTimes(1);
  });
});
