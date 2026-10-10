import { Logger } from "@nestjs/common";
import { ClassificationScheduler } from "./classification.scheduler";
import type { ClassificationProducer } from "../queue/classification.producer";

// The scheduler's dependency is a test double, not the real Redis producer.
jest.mock("../queue/classification.producer", () => ({
  ClassificationProducer: class {},
}));

describe("ClassificationScheduler", () => {
  const enqueue = jest.fn();
  let scheduler: ClassificationScheduler;

  beforeEach(() => {
    enqueue.mockReset().mockResolvedValue(undefined);
    scheduler = new ClassificationScheduler({
      enqueuePendingClassifications: enqueue,
    } as unknown as ClassificationProducer);
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => {});
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it("enqueues at bootstrap and on the scheduled pass", async () => {
    await scheduler.onApplicationBootstrap();
    await scheduler.runScheduledClassification();
    expect(enqueue).toHaveBeenCalledTimes(2);
  });

  it("does not overlap startup and scheduled passes", async () => {
    let finish!: () => void;
    enqueue.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const startup = scheduler.onApplicationBootstrap();
    await scheduler.runScheduledClassification();
    expect(enqueue).toHaveBeenCalledTimes(1);
    finish();
    await startup;
    await scheduler.runScheduledClassification();
    expect(enqueue).toHaveBeenCalledTimes(2);
  });

  it("logs the cause and allows the next pass after a failure", async () => {
    enqueue.mockRejectedValueOnce(new Error("Redis unavailable"));
    await scheduler.runScheduledClassification();
    expect(Logger.prototype.error).toHaveBeenCalledWith(
      expect.stringContaining("Redis unavailable"),
    );
    await scheduler.runScheduledClassification();
    expect(enqueue).toHaveBeenCalledTimes(2);
  });
});
