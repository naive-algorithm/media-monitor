import { NEWS_INGESTION_QUEUE_NAME, INGEST_SOURCE_JOB_NAME } from "./news-ingestion.constants";
import { Logger } from "@nestjs/common";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { IngestSourceJobData } from "./ingest-source-job.type";
import { IngestionStatus, NewsIngestionService } from "./news-ingestion.service";
import { SourcesService } from "src/sources/sources.service";

@Processor(NEWS_INGESTION_QUEUE_NAME)
export class NewsIngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(NewsIngestionProcessor.name);
  constructor(
    private readonly newsIngestionService: NewsIngestionService,
    private readonly sourcesService: SourcesService,
  ) {
    super();
  }
  async process(job: Job<IngestSourceJobData>) {
    if (job.name !== INGEST_SOURCE_JOB_NAME) {
      throw new Error(`Unknown job type: ${job.name}`);
    }
    this.logger.log(`Running job ${job.name}:${job.id}...`);

    const sourceId = job.data.sourceId;
    const source = await this.sourcesService.findById(sourceId);

    if (!source.isEnabled) {
      this.logger.warn(`Cannot import: Source ${source.name} is not enabled`);
      return;
    }

    const ingestionResult = await this.newsIngestionService.ingestFromSource(source);

    switch (ingestionResult.status) {
      case IngestionStatus.SUCCESS:
        this.logger.log(`Job ${job.name}:${job.id} has been successfully done`);
        this.logger.log(
          `Source: ${source.name} Imported: ${ingestionResult.imported}, rejected: ${ingestionResult.rejected}, skipped: ${ingestionResult.skipped}, status: ${ingestionResult.status}`,
        );
        return;
      case IngestionStatus.PARTIAL:
        this.logger.log(
          `Job ${job.name}:${job.id} has been done. Some of the news (${ingestionResult.rejected}) weren't imported`,
        );
        this.logger.log(
          `Source: ${source.name} Imported: ${ingestionResult.imported}, rejected: ${ingestionResult.rejected}, skipped: ${ingestionResult.skipped}, status: ${ingestionResult.status}`,
        );
        return;
      default:
        this.logger.error(
          `Source: ${source.name} Imported: ${ingestionResult.imported}, rejected: ${ingestionResult.rejected}, skipped: ${ingestionResult.skipped}, status: ${ingestionResult.status}`,
        );
        throw new Error("News ingestion failed");
    }
  }
}
