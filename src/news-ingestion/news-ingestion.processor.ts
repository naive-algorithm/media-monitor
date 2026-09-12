import {
  NEWS_INGESTION_QUEUE_NAME,
  INGEST_SOURCE_JOB_NAME,
} from "./news-ingestion.constants";
import { formatLogMessage } from "../common/logging/format-log-message";
import {
  BeforeApplicationShutdown,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job, UnrecoverableError } from "bullmq";
import {
  IngestSourceJobData,
  IngestSourceJobResult,
} from "./ingest-source-job.type";
import { NewsIngestionService } from "./news-ingestion.service";
import {
  IngestionFailure,
  IngestionResult,
  IngestionStatus,
} from "./ingestion-result.type";
import { SourcesService } from "src/sources/sources.service";
import { Source } from "src/sources/source.entity";
import { IngestionRunsService } from "src/ingestion-runs/ingestion-runs.service";

@Processor(NEWS_INGESTION_QUEUE_NAME, {
  concurrency: 4,
})
export class NewsIngestionProcessor
  extends WorkerHost
  implements BeforeApplicationShutdown
{
  private readonly logger = new Logger(NewsIngestionProcessor.name);
  constructor(
    private readonly newsIngestionService: NewsIngestionService,
    private readonly sourcesService: SourcesService,
    private readonly ingestionRunsService: IngestionRunsService,
  ) {
    super();
  }

  async process(job: Job<IngestSourceJobData>): Promise<IngestSourceJobResult> {
    const startedAt = performance.now();
    if (job.name !== INGEST_SOURCE_JOB_NAME) {
      throw new UnrecoverableError(`Unknown job type: ${job.name}`);
    }
    this.logger.debug(
      formatLogMessage("Ingestion started", {
        jobId: job.id,
        sourceId: job.data.sourceId,
        attempt: job.attemptsStarted,
      }),
    );

    const sourceId = job.data.sourceId;
    const source = await this.loadSource(job);

    const runId = await this.ingestionRunsService.recordRunStart({
      sourceId: source.id,
      jobId: job.id!,
      attempt: job.attemptsStarted,
    });

    if (!source.isEnabled) {
      await this.ingestionRunsService.recordRunFinish(runId, {
        total: null,
        imported: 0,
        rejected: 0,
        skipped: 0,
        status: "SKIPPED",
      });
      this.logger.log(
        formatLogMessage(`${source.name} — ingestion skipped`, {
          jobId: job.id,
          sourceId,
          reason: "source-disabled",
          durationMs: Math.round(performance.now() - startedAt),
        }),
      );
      return {
        status: "SKIPPED",
        reason: "source-disabled",
        sourceId: source.id,
      };
    }

    const ingestionResult =
      await this.newsIngestionService.ingestFromSource(source);

    await this.ingestionRunsService.recordRunFinish(runId, ingestionResult);

    this.logIngestionResult(
      job,
      source,
      ingestionResult,
      Math.round(performance.now() - startedAt),
    );

    if (ingestionResult.status === IngestionStatus.FAILED) {
      throw this.createIngestionError(ingestionResult.failure);
    }

    return {
      status: "PROCESSED",
      ingestion: ingestionResult,
    };
  }

  private async loadSource(job: Job<IngestSourceJobData>): Promise<Source> {
    const startedAt = performance.now();
    const sourceId = job.data.sourceId;

    try {
      return await this.sourcesService.findById(sourceId);
    } catch (error: unknown) {
      this.logger.error(
        formatLogMessage("Source lookup failed", {
          jobId: job.id,
          sourceId,
          attempt: job.attemptsStarted,
          durationMs: Math.round(performance.now() - startedAt),
          cause: error,
        }),
      );
      if (error instanceof NotFoundException) {
        throw new UnrecoverableError(`Source ${sourceId} not found`);
      }
      throw error;
    }
  }

  private createIngestionError(failure: IngestionFailure): Error {
    switch (failure.reason) {
      case "all-items-rejected":
        return new UnrecoverableError(`All items rejected`);

      case "exception": {
        if (failure.cause instanceof Error) {
          return failure.cause;
        }
        return new Error("News ingestion failed: a non-Error value was thrown");
      }
      default: {
        const unexpected: never = failure;
        throw new Error(`Unexpected ingestion failure: ${String(unexpected)}`);
      }
    }
  }

  private logIngestionResult(
    job: Job<IngestSourceJobData>,
    source: Source,
    result: IngestionResult,
    durationMs: number,
  ) {
    const context = {
      jobId: job.id,
      sourceId: source.id,
      attempt: job.attemptsStarted,
      durationMs,
      imported: result.imported,
      rejected: result.rejected,
      skipped: result.skipped,
    };

    switch (result.status) {
      case IngestionStatus.SUCCESS:
        this.logger.log(
          formatLogMessage(`${source.name} — ingestion succeeded`, context),
        );
        return;
      case IngestionStatus.PARTIAL:
        this.logger.warn(
          formatLogMessage(
            `${source.name} — ingestion partially completed`,
            context,
          ),
        );
        return;
      case IngestionStatus.FAILED: {
        const errorContext = {
          ...context,
          stage: result.failure.stage,
          reason: result.failure.reason,
          cause:
            result.failure.reason === "exception"
              ? result.failure.cause
              : undefined,
        };

        this.logger.error(
          formatLogMessage(
            `${source.name} — ingestion attempt failed`,
            errorContext,
          ),
        );
        return;
      }
    }
  }

  async beforeApplicationShutdown() {
    await this.worker.close();
  }
}
