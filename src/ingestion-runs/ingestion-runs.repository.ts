import { Injectable, Inject } from "@nestjs/common";
import { Pool } from "pg";
import { DATABASE_POOL } from "src/database/database.constant";
import { StartIngestionRunInput, FinishIngestionRunInput } from "./ingestion-runs.type";

@Injectable()
export class IngestionRunsRepository {
  constructor(
    @Inject(DATABASE_POOL)
    private readonly pool: Pool,
  ) {}

  async create(input: StartIngestionRunInput): Promise<number> {
    const result = await this.pool.query(
      `
            INSERT INTO ingestion_runs(
                source_id,
                job_id,
                attempt
            ) 
            VALUES($1, $2, $3)
            RETURNING id`,
      [input.sourceId, input.jobId, input.attempt],
    );

    return result.rows[0].id;
  }

  async finish(runId: number, input: FinishIngestionRunInput): Promise<void> {
    const result = await this.pool.query(
      `
        UPDATE ingestion_runs
        SET total = $1, imported = $2, skipped = $3, rejected = $4, status = $5, finished_at = NOW()
        WHERE id = $6 AND finished_at IS NULL
        `,
      [input.total, input.imported, input.skipped, input.rejected, input.status, runId],
    );

    if (result.rowCount === 0) {
      throw new Error(`Ingestion run ${runId} not found or already finished`);
    }
  }
}
