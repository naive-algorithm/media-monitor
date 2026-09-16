import { Injectable } from "@nestjs/common";
import { IngestionRunsRepository } from "./ingestion-runs.repository";
import {
  FinishIngestionRunInput,
  StartIngestionRunInput,
} from "./ingestion-runs.type";
import { IngestionResult } from "src/news-ingestion/ingestion-result.type";

@Injectable()
export class IngestionRunsService {
  constructor(private readonly repository: IngestionRunsRepository) {}

  recordRunStart(input: StartIngestionRunInput): Promise<number> {
    return this.repository.create(input);
  }

  recordRunFinish(runId: number, outcome: IngestionResult): Promise<void> {
    const { failure, ...summary } = outcome;

    const input: FinishIngestionRunInput = {
      ...summary,
      ...(failure && {
        failure: {
          stage: failure.stage,
          reason: failure.reason,
          message:
            failure.reason === "all-items-rejected"
              ? "All collected items were rejected"
              : failure.cause instanceof Error
                ? failure.cause.message
                : String(failure.cause),
        },
      }),
    };

    return this.repository.finish(runId, input);
  }

  recordRunSkipped(runId: number): Promise<void> {
    return this.repository.finish(runId, {
      total: null,
      imported: 0,
      rejected: 0,
      skipped: 0,
      status: "SKIPPED",
    });
  }
}
