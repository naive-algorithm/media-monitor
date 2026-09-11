import { NEWS_INGESTION_QUEUE_NAME, INGEST_SOURCE_JOB_NAME } from "./news-ingestion.constants";
import { Queue } from "bullmq";
import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { IngestSourceJobData } from "./ingest-source-job.type";
import { SourcesService } from "src/sources/sources.service";
import { Source } from "src/sources/source.entity";

type SourceId = Source['id'];

@Injectable()
export class NewsIngestionProducer {
  constructor(
    @InjectQueue(NEWS_INGESTION_QUEUE_NAME)
    private readonly queue: Queue<IngestSourceJobData>,
    private readonly sources: SourcesService,
  ) {}

  private async enqueueSourceIngestion(sourceId: SourceId) {
    await this.queue.add(INGEST_SOURCE_JOB_NAME, { sourceId });
  }

  async enqueueIngestionForEnabledSources() {
    const sources = await this.sources.findEnabled();
    for (const source of sources) {
      await this.enqueueSourceIngestion(source.id);
    }
  }
}
