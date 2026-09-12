import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { formatLogMessage } from "../common/logging/format-log-message";
import { NewsIngestionProducer } from "src/news-ingestion/news-ingestion.producer";

@Injectable()
export class NewsIngestionScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(NewsIngestionScheduler.name);

  constructor(private readonly newsIngestionProducer: NewsIngestionProducer) {}

  async onApplicationBootstrap() {
    await this.scheduleNewsIngestion();
  }

  private async scheduleNewsIngestion() {
    this.logger.debug("ingestion.enqueue_started");
    try {
      await this.newsIngestionProducer.enqueueIngestionForEnabledSources();
      this.logger.log("ingestion.enqueue_completed");
    } catch (e) {
      this.logger.error(formatLogMessage("ingestion.enqueue_failed", { cause: e }));
    }
  }

  @Cron("*/10 * * * *")
  private async runScheduledIngestion() {
    await this.scheduleNewsIngestion();
  }
}
