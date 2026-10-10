import { ConfigService } from "@nestjs/config";
import { Logger } from "@nestjs/common";
import * as fs from "node:fs/promises";
import { pipeline } from "@huggingface/transformers";
import { DebertaClassifierAdapter } from "./deberta-classifier.adapter";
import {
  CLASSIFIER_VERSION,
  TOPIC_SCORE_THRESHOLD,
  MAX_DESCRIPTION_LENGTH,
} from "./deberta-classifier.config";

// Do not import native inference binaries or load weights in unit tests.
jest.mock("@huggingface/transformers", () => ({
  pipeline: jest.fn(),
  env: {},
}));

describe("DebertaClassifierAdapter", () => {
  let adapter: DebertaClassifierAdapter;
  let infer: jest.Mock;
  let dispose: jest.Mock;
  const input = { title: " Headline ", description: null };

  beforeEach(() => {
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => {});
    jest.spyOn(Logger.prototype, "debug").mockImplementation(() => {});
    jest.spyOn(fs, "readFile").mockResolvedValue(
      JSON.stringify({
        categories: [
          { id: "a", modelLabel: "Topic A" },
          { id: "b", modelLabel: "Topic B" },
        ],
      }),
    );
    infer = jest.fn().mockResolvedValue({
      labels: ["Topic A", "Topic B"],
      scores: [TOPIC_SCORE_THRESHOLD, 0.1],
    });
    dispose = jest.fn().mockResolvedValue(undefined);
    (pipeline as jest.Mock).mockResolvedValue(
      Object.assign(infer, { dispose }),
    );
    adapter = new DebertaClassifierAdapter(new ConfigService());
  });

  afterEach(() => jest.restoreAllMocks());

  it("requires initialization", async () => {
    await expect(adapter.classify(input)).rejects.toThrow("not initialized");
  });

  it("accepts the threshold boundary and excludes lower scores", async () => {
    await adapter.onModuleInit();
    await expect(adapter.classify(input)).resolves.toEqual({
      status: "CLASSIFIED",
      classifierVersion: CLASSIFIER_VERSION,
      topics: [{ topicCode: "a", score: TOPIC_SCORE_THRESHOLD }],
    });
    expect(infer).toHaveBeenCalledWith(
      "Headline",
      ["Topic A", "Topic B"],
      expect.objectContaining({ multi_label: true }),
    );
  });

  it("returns UNCLASSIFIED when no topic meets the threshold", async () => {
    await adapter.onModuleInit();
    infer.mockResolvedValueOnce({
      labels: ["Topic A", "Topic B"],
      scores: [0.1, 0.2],
    });
    await expect(adapter.classify(input)).resolves.toEqual({
      status: "UNCLASSIFIED",
      classifierVersion: CLASSIFIER_VERSION,
    });
  });

  it("rejects empty titles and limits the description", async () => {
    await adapter.onModuleInit();
    await expect(
      adapter.classify({ title: "  ", description: "Text" }),
    ).rejects.toThrow("non-empty");
    expect(infer).not.toHaveBeenCalled();
    await adapter.classify({
      title: "Title",
      description: "x".repeat(MAX_DESCRIPTION_LENGTH + 10),
    });
    expect(infer.mock.calls[0][0]).toBe(
      "Title\n" + "x".repeat(MAX_DESCRIPTION_LENGTH),
    );
  });

  it.each([
    { labels: ["Unknown", "Topic B"], scores: [0.9, 0.9] },
    { labels: ["Topic A", "Topic A"], scores: [0.9, 0.9] },
    { labels: ["Topic A"], scores: [0.9] },
    { labels: ["Topic A", "Topic B"], scores: [NaN, 0.9] },
    { labels: ["Topic A", "Topic B"], scores: [1.1, 0.9] },
    { labels: ["Topic A", "Topic B"], scores: [0.9] },
    { labels: ["Topic A", "Topic B"], scores: [0.9, 0.8, 0.7] },
  ])("rejects invalid model output: %j", async (prediction) => {
    await adapter.onModuleInit();
    infer.mockResolvedValueOnce(prediction);
    await expect(adapter.classify(input)).rejects.toThrow();
  });

  it("blocks concurrent inference and releases busy after a failure", async () => {
    await adapter.onModuleInit();
    let rejectInference!: (error: Error) => void;
    infer.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectInference = reject;
        }),
    );
    const first = adapter.classify(input);
    await expect(adapter.classify(input)).rejects.toThrow(
      "one article at a time",
    );
    await expect(adapter.onApplicationShutdown()).rejects.toThrow(
      "in progress",
    );
    const cause = new Error("inference failed");
    rejectInference(cause);
    await expect(first).rejects.toBe(cause);
    await expect(adapter.classify(input)).resolves.toHaveProperty(
      "status",
      "CLASSIFIED",
    );
  });

  it("rejects new calls as soon as disposal starts and disposes only once", async () => {
    await adapter.onModuleInit();
    let finish!: () => void;
    dispose.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const shutdown = adapter.onApplicationShutdown();
    await expect(adapter.classify(input)).rejects.toThrow("shutting down");
    finish();
    await shutdown;
    await adapter.onApplicationShutdown();
    expect(dispose).toHaveBeenCalledTimes(1);
  });
});
