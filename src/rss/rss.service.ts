import { Injectable, Logger } from "@nestjs/common";
import { XMLParser } from "fast-xml-parser";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { NewsItem } from "./news-item.interface";
import { RssItemDto } from "./rss-item.dto";

export type CollectionResult = {
  items: NewsItem[];
  total: number;
  rejected: number;
};

@Injectable()
export class RssService {
  private readonly logger = new Logger(RssService.name);
  async collect(url: string): Promise<CollectionResult> {
    const collectionResult: CollectionResult = {
      items: [],
      total: 0,
      rejected: 0,
    };

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} : ${res.statusText}`);
    }

    const parser = new XMLParser({ parseTagValue: false });
    const parsedFeed: unknown = parser.parse(await res.text());
    const rawItems = this.extractRssItems(parsedFeed);

    const normalizationResults = await Promise.allSettled(
      rawItems.map((rawItem) => this.normalizeRssItem(rawItem)),
    );

    for (const normalizationResult of normalizationResults) {
      if (normalizationResult.status === "fulfilled") {
        collectionResult.items.push(normalizationResult.value);
      } else {
        this.logger.error(
          `Error processing RSS item: ${normalizationResult.reason}`,
        );
        collectionResult.rejected++;
      }
    }

    collectionResult.total =
      collectionResult.items.length + collectionResult.rejected;

    return collectionResult;
  }

  private extractRssItems(parsedFeed: unknown): unknown[] {
    if (
      typeof parsedFeed !== "object" ||
      parsedFeed === null ||
      Array.isArray(parsedFeed) ||
      !("rss" in parsedFeed)
    ) {
      throw new Error("Invalid RSS feed: Expected an rss root");
    }

    const rss = parsedFeed.rss;
    if (
      typeof rss !== "object" ||
      rss === null ||
      Array.isArray(rss) ||
      !("channel" in rss)
    ) {
      throw new Error("Invalid RSS feed: Expected a channel");
    }

    const channel = rss.channel;
    if (
      typeof channel !== "object" ||
      channel === null ||
      Array.isArray(channel)
    ) {
      throw new Error("Invalid RSS feed: Expected a channel object");
    }

    if (!("item" in channel)) {
      return [];
    }

    return Array.isArray(channel.item) ? channel.item : [channel.item];
  }

  async normalizeRssItem(rssItem: unknown): Promise<NewsItem> {
    const item = plainToInstance(RssItemDto, rssItem);
    const errors = await validate(item);
    if (errors.length > 0) {
      throw new Error(`Invalid RSS item: ${JSON.stringify(errors)}`);
    }

    const date = new Date(item.pubDate);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid publication date: ${item.guid}`);
    }

    return {
      title: item.title,
      description: item.description ?? "",
      url: item.link,
      publishedAt: date,
      externalId: item.guid,
    };
  }
}
