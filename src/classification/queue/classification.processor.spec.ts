import { Logger, NotFoundException } from "@nestjs/common";
import type { Job } from "bullmq";
import { ClassificationProcessor } from "./classification.processor";
import type { ClassificationService } from "../classification.service";
import type { ClassificationRunsService } from "../runs/classification-runs.service";
import { ArticleClassificationError } from "../errors/article-classification.error";
import { TARGET_CLASSIFIER_VERSION } from "../classification.config";
import { ARTICLE_CLASSIFICATION_JOB_NAME } from "./classification.constants";
import type { ClassifyArticleJobData } from "./classify-article-job.types";

// Exercise our processor policy without Redis or Nest's ESM worker integration.
jest.mock("@nestjs/bullmq", () => ({
  Processor: () => () => {},
  OnWorkerEvent: () => () => {},
  WorkerHost: class {},
}));
jest.mock("bullmq", () => ({
  UnrecoverableError: class UnrecoverableError extends Error {},
}));

describe("ClassificationProcessor", () => {
  let processor: ClassificationProcessor;
  const classify = jest.fn();
  const recordRunStart = jest.fn();
  const recordRunFinish = jest.fn();
  const job = {
    id: "test-job",
    name: ARTICLE_CLASSIFICATION_JOB_NAME,
    attemptsStarted: 1,
    data: { articleId: 42, classifierVersion: TARGET_CLASSIFIER_VERSION },
  } as Job<ClassifyArticleJobData>;

  beforeEach(() => {
    classify.mockReset();
    recordRunStart.mockReset().mockResolvedValue(7);
    recordRunFinish.mockReset().mockResolvedValue(undefined);
    processor = new ClassificationProcessor(
      { classifyArticle: classify } as unknown as ClassificationService,
      {
        recordRunStart,
        recordRunFinish,
      } as unknown as ClassificationRunsService,
    );
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => {});
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it.each([
    { status: "UNCLASSIFIED", classifierVersion: TARGET_CLASSIFIER_VERSION },
    {
      status: "CLASSIFIED",
      classifierVersion: TARGET_CLASSIFIER_VERSION,
      topics: [{ topicCode: "test", score: 0.9 }],
    },
  ])("returns successful result $status unchanged", async (result) => {
    classify.mockResolvedValueOnce(result);
    await expect(processor.process(job)).resolves.toBe(result);
    expect(classify).toHaveBeenCalledWith(42);
    expect(recordRunFinish).toHaveBeenCalledWith(7, {
      status: "SUCCESS",
      classificationStatus: result.status,
    });
  });

  it("rejects an unknown operation before inference", async () => {
    await expect(
      processor.process({ ...job, name: "wrong" } as typeof job),
    ).rejects.toThrow("Unknown job type");
    expect(classify).not.toHaveBeenCalled();
  });

  it("rejects an incompatible version before inference", async () => {
    await expect(
      processor.process({
        ...job,
        data: { ...job.data, classifierVersion: "old" },
      } as typeof job),
    ).rejects.toThrow("doesn't match");
    expect(classify).not.toHaveBeenCalled();
  });

  it("marks a missing article as unrecoverable", async () => {
    classify.mockRejectedValueOnce(
      new ArticleClassificationError(
        42,
        "loading-article",
        new NotFoundException(),
      ),
    );
    const { UnrecoverableError } = jest.requireMock("bullmq");
    await expect(processor.process(job)).rejects.toBeInstanceOf(
      UnrecoverableError,
    );
  });

  it("preserves technical errors for retries", async () => {
    const error = new ArticleClassificationError(
      42,
      "saving-result",
      new Error("DB unavailable"),
    );
    classify.mockRejectedValueOnce(error);
    await expect(processor.process(job)).rejects.toBe(error);
    expect(recordRunFinish).toHaveBeenCalledWith(7, {
      status: "FAILED",
      failure: {
        stage: "saving-result",
        reason: "exception",
        message: "DB unavailable",
      },
    });
  });

  it("does not fail a successful classification when history finish fails", async () => {
    const result = {
      status: "UNCLASSIFIED",
      classifierVersion: TARGET_CLASSIFIER_VERSION,
    };
    classify.mockResolvedValueOnce(result);
    recordRunFinish.mockRejectedValueOnce(new Error("History unavailable"));

    await expect(processor.process(job)).resolves.toBe(result);
    expect(Logger.prototype.error).toHaveBeenCalled();
  });

  it("preserves the classification error when recording failure also fails", async () => {
    const error = new ArticleClassificationError(
      42,
      "classifying",
      new Error("Inference failed"),
    );
    classify.mockRejectedValueOnce(error);
    recordRunFinish.mockRejectedValueOnce(new Error("History unavailable"));

    await expect(processor.process(job)).rejects.toBe(error);
  });

  it("awaits worker close before completing the shutdown hook", async () => {
    let finish!: () => void;
    const close = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    Object.defineProperty(processor, "worker", { value: { close } });
    let closed = false;
    const shutdown = processor.beforeApplicationShutdown().then(() => {
      closed = true;
    });
    await Promise.resolve();
    expect(closed).toBe(false);
    finish();
    await shutdown;
    expect(closed).toBe(true);
  });
});
