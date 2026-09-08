import { Injectable } from "@nestjs/common";
import { CollectorType } from "./collector-type.enum";
import { Collector } from "./collector.interface";
import { RssCollector } from "../rss/rss.collector";

@Injectable()
export class CollectorsRegistry {
  private readonly collectors = new Map<CollectorType, Collector>();

  constructor(private readonly rssCollector: RssCollector) {
    this.registerCollector(CollectorType.RSS, this.rssCollector);
  }

  registerCollector(type: CollectorType, collector: Collector): void {
    if (this.collectors.has(type)) {
      throw new Error(`Collector for type ${type} is already registered.`);
    }
    this.collectors.set(type, collector);
  }

  getCollector(type: CollectorType): Collector {
    const collector = this.collectors.get(type);
    if (!collector) {
      throw new Error(`Collector for type ${type} not found.`);
    }
    return collector;
  }
}
