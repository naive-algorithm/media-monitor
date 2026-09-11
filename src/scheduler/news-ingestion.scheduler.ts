import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { NewsIngestionProducer } from "src/news-ingestion/news-ingestion.producer";

@Injectable()
export class NewsIngestionScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(NewsIngestionScheduler.name);

  constructor(private readonly newsIngestionProducer: NewsIngestionProducer) {}

  async onApplicationBootstrap() {
    await this.scheduleNewsIngestion();
  }

  private async scheduleNewsIngestion() {
    this.logger.log("Enqueuing news ingestion jobs...");
    try {
      await this.newsIngestionProducer.enqueueIngestionForEnabledSources();
      this.logger.log("News ingestion jobs enqueued");
    } catch (e) {
      if (e instanceof Error) {
        this.logger.error("Failed to enqueue news ingestion jobs", e.stack);
      } else this.logger.error("Failed to enqueue news ingestion jobs");
    }
  }

  @Cron("*/10 * * * *")
  private async runScheduledIngestion() {
    await this.scheduleNewsIngestion();
  }
}
