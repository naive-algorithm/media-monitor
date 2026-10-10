import { Test } from "@nestjs/testing";
import { ArticlesService } from "src/articles/articles.service";
import { SourcesService } from "src/sources/sources.service";
import { CollectorsRegistry } from "src/collectors/collectors.registry";
import { CollectorType } from "src/collectors/collector-type.enum";
import { Source } from "src/sources/source.entity";
import { NewsIngestionService } from "./news-ingestion.service";

describe("NewsIngestionService", () => {
  const source = new Source(
    1,
    "Example",
    "https://example.com/rss",
    CollectorType.RSS,
    true,
    null,
  );
  const item = {
    title: "Title",
    description: "",
    url: "https://example.com/news",
    externalId: "1",
    publishedAt: new Date("2026-10-10"),
  };
  let service: NewsIngestionService;
  let collect: jest.Mock;
  let create: jest.Mock;
  let updateLastCollectedAt: jest.Mock;

  beforeEach(async () => {
    collect = jest
      .fn()
      .mockResolvedValue({
        total: 2,
        rejected: 0,
        items: [item, { ...item, externalId: "2" }],
      });
    create = jest.fn().mockResolvedValue({ status: "created" });
    updateLastCollectedAt = jest.fn().mockResolvedValue(undefined);
    const module = await Test.createTestingModule({
      providers: [
        NewsIngestionService,
        {
          provide: CollectorsRegistry,
          useValue: { getCollector: jest.fn().mockReturnValue({ collect }) },
        },
        { provide: ArticlesService, useValue: { create } },
        { provide: SourcesService, useValue: { updateLastCollectedAt } },
      ],
    }).compile();
    service = module.get(NewsIngestionService);
  });

  it("counts created and duplicate articles and advances the checkpoint", async () => {
    create
      .mockResolvedValueOnce({ status: "created" })
      .mockResolvedValueOnce({ status: "duplicate" });
    await expect(service.ingestFromSource(source)).resolves.toEqual({
      total: 2,
      imported: 1,
      skipped: 1,
      rejected: 0,
      status: "SUCCESS",
    });
    expect(updateLastCollectedAt).toHaveBeenCalledWith(1);
  });

  it("retains partial counts after a persistence failure", async () => {
    const cause = new Error("database unavailable");
    create
      .mockResolvedValueOnce({ status: "created" })
      .mockRejectedValueOnce(cause);
    await expect(service.ingestFromSource(source)).resolves.toMatchObject({
      status: "FAILED",
      imported: 1,
      failure: { stage: "saving-articles", reason: "exception", cause },
    });
    expect(updateLastCollectedAt).not.toHaveBeenCalled();
  });

  it("records a collection failure before any persistence", async () => {
    const cause = new Error("network timeout");
    collect.mockRejectedValueOnce(cause);
    await expect(service.ingestFromSource(source)).resolves.toMatchObject({
      status: "FAILED",
      total: null,
      imported: 0,
      failure: { stage: "collecting", cause },
    });
    expect(create).not.toHaveBeenCalled();
    expect(updateLastCollectedAt).not.toHaveBeenCalled();
  });

  it("marks all rejected items as FAILED without advancing the checkpoint", async () => {
    collect.mockResolvedValueOnce({ total: 2, rejected: 2, items: [] });
    await expect(service.ingestFromSource(source)).resolves.toMatchObject({
      status: "FAILED",
      failure: { stage: "collecting", reason: "all-items-rejected" },
    });
    expect(create).not.toHaveBeenCalled();
    expect(updateLastCollectedAt).not.toHaveBeenCalled();
  });

  it("advances the checkpoint for a PARTIAL result", async () => {
    collect.mockResolvedValueOnce({ total: 2, rejected: 1, items: [item] });
    await expect(service.ingestFromSource(source)).resolves.toMatchObject({
      status: "PARTIAL",
      imported: 1,
      rejected: 1,
    });
    expect(updateLastCollectedAt).toHaveBeenCalledWith(1);
  });

  it("keeps saved counts if updating the checkpoint fails", async () => {
    const cause = new Error("checkpoint failed");
    updateLastCollectedAt.mockRejectedValueOnce(cause);
    await expect(service.ingestFromSource(source)).resolves.toMatchObject({
      status: "FAILED",
      imported: 2,
      failure: { stage: "updating-source-timestamp", cause },
    });
  });
});
