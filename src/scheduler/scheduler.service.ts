import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { NewsImportService } from "src/news-import/news-import.service";

@Injectable()
export class SchedulerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly newsImportService: NewsImportService) {}

  async onApplicationBootstrap() {
    await this.importNews();
  }

  private async importNews() {
    this.logger.log("Start importing news...");
    try {
      const results = await this.newsImportService.importEnabledSources();

      for (const result of results) {
        this.logger.log(
          `${result.source}: fetched: ${result.total}, imported: ${result.imported}, skipped: ${result.skipped}, rejected: ${result.rejected}, status: ${result.status} `,
        );
      }

      this.logger.log("News imported.");
    } catch (e) {
      if (e instanceof Error) {
        this.logger.error("News import failed.", e.stack);
      } else this.logger.error("News import failed");
    }
  }

  @Cron("*/10 * * * *")
  private async runImportNews() {
    await this.importNews();
  }
}
