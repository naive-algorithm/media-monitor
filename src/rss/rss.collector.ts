import { Injectable, Logger } from "@nestjs/common";
import { formatLogMessage } from "../common/logging/format-log-message";
import { XMLParser } from "fast-xml-parser";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { compile, type compiledFunction } from "html-to-text";
import { Collector } from "../collectors/collector.abstract";
import { Collects } from "../collectors/collects.decorator";
import { CollectorType } from "../collectors/collector-type.enum";
import { CollectionResult } from "../collectors/collection-result.type";
import { CollectedItem } from "../collectors/collected-item.interface";
import { RssItemDto } from "./rss-item.dto";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const RSS_FETCH_TIMEOUT_MS = 15_000;

class InvalidRssItemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidRssItemError";
  }
}

@Injectable()
@Collects(CollectorType.RSS)
export class RssCollector extends Collector {
  private readonly logger = new Logger(RssCollector.name);
  private readonly htmlToTextConverter: compiledFunction;

  constructor() {
    super();
    this.htmlToTextConverter = compile({
      wordwrap: false,
      selectors: [{ selector: "a", options: { ignoreHref: true } }],
    });
  }

  async collect(url: string): Promise<CollectionResult> {
    const collectionResult: CollectionResult = {
      items: [],
      total: 0,
      rejected: 0,
    };

    const res = await fetch(url, {
      signal: AbortSignal.timeout(RSS_FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} : ${res.statusText}`);
    }

    const parser = new XMLParser({ parseTagValue: false });
    const parsedFeed: unknown = parser.parse(await res.text());
    const rawItems = this.extractRssItems(parsedFeed);

    const normalizationResults: PromiseSettledResult<CollectedItem>[] =
      await Promise.allSettled(
        rawItems.map((rawItem) => this.normalizeRssItem(rawItem)),
      );

    for (const normalizationResult of normalizationResults) {
      if (normalizationResult.status === "fulfilled") {
        collectionResult.items.push(normalizationResult.value);
      } else if (normalizationResult.reason instanceof InvalidRssItemError) {
        this.logger.warn(
          formatLogMessage("rss.item_rejected", {
            reason: normalizationResult.reason.message,
          }),
        );
        collectionResult.rejected++;
      } else if (normalizationResult.reason instanceof Error) {
        throw normalizationResult.reason;
      } else {
        throw new Error(
          `Unknown error during RSS item normalization: ${normalizationResult.reason}`,
        );
      }
    }

    collectionResult.total =
      collectionResult.items.length + collectionResult.rejected;

    return collectionResult;
  }

  private extractRssItems(parsedFeed: unknown): unknown[] {
    if (!isRecord(parsedFeed) || !("rss" in parsedFeed)) {
      throw new Error("Invalid RSS feed: Expected an rss root");
    }

    const rss = parsedFeed.rss;
    if (!isRecord(rss) || !("channel" in rss)) {
      throw new Error("Invalid RSS feed: Expected a channel");
    }

    const channel = rss.channel;
    if (!isRecord(channel)) {
      throw new Error("Invalid RSS feed: Expected a channel object");
    }

    if (!("item" in channel)) {
      return [];
    }

    return Array.isArray(channel.item) ? channel.item : [channel.item];
  }

  async normalizeRssItem(rssItem: unknown): Promise<CollectedItem> {
    if (!isRecord(rssItem)) {
      throw new InvalidRssItemError(`Invalid RSS item: Expected an object`);
    }
    const item = plainToInstance(RssItemDto, rssItem);
    const errors = await validate(item);
    if (errors.length > 0) {
      throw new InvalidRssItemError(
        `Invalid RSS item: ${JSON.stringify(errors)}`,
      );
    }

    const date = new Date(item.pubDate);
    if (Number.isNaN(date.getTime())) {
      throw new InvalidRssItemError(`Invalid publication date: ${item.guid}`);
    }

    const description = this.htmlToTextConverter(item.description ?? "").trim();

    return {
      title: item.title,
      description,
      url: item.link,
      publishedAt: date,
      externalId: item.guid,
    };
  }
}
