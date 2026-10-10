import { Logger } from "@nestjs/common";
import { RssCollector } from "./rss.collector";

describe("RssCollector", () => {
  const item = {
    title: "  Oil &#038; gas  ",
    description: '<p>Read <a href="https://example.com">more</a>.</p>',
    link: "https://example.com/news",
    pubDate: "2026-10-10T00:00:00Z",
    guid: "00123",
  };
  let collector: RssCollector;

  beforeEach(() => {
    collector = new RssCollector();
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it("normalizes text without changing the external ID", async () => {
    await expect(collector.normalizeRssItem(item)).resolves.toEqual({
      title: "Oil & gas",
      description: "Read more.",
      url: item.link,
      externalId: "00123",
      publishedAt: new Date(item.pubDate),
    });
  });

  it("rejects a title that becomes empty after HTML removal", async () => {
    await expect(
      collector.normalizeRssItem({ ...item, title: "<b></b>" }),
    ).rejects.toThrow("Empty title");
  });

  it("rejects invalid dates", async () => {
    await expect(
      collector.normalizeRssItem({ ...item, pubDate: "not a date" }),
    ).rejects.toThrow("Invalid publication date");
  });

  it("parses a single item and preserves a numeric-looking GUID", async () => {
    const xml = `<rss><channel><item><title>Title</title><link>${item.link}</link><guid>00123</guid><pubDate>${item.pubDate}</pubDate></item></channel></rss>`;
    jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response(xml));
    const result = await collector.collect("https://example.com/feed");
    expect(result).toMatchObject({
      total: 1,
      rejected: 0,
      items: [{ externalId: "00123", description: "" }],
    });
  });

  it("skips an invalid item without losing a valid one", async () => {
    const valid = `<item><title>Title</title><link>${item.link}</link><guid>1</guid><pubDate>${item.pubDate}</pubDate></item>`;
    jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          `<rss><channel>${valid}<item><title>Invalid</title></item></channel></rss>`,
        ),
      );
    const result = await collector.collect("https://example.com/feed");
    expect(result).toMatchObject({ total: 2, rejected: 1 });
    expect(result.items).toHaveLength(1);
  });

  it("propagates HTTP failures", async () => {
    jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(null, { status: 503, statusText: "Unavailable" }),
      );
    await expect(collector.collect("https://example.com/feed")).rejects.toThrow(
      "HTTP 503",
    );
  });
});
