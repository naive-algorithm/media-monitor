import { Injectable, Inject } from "@nestjs/common";
import { Pool } from "pg";
import { DATABASE_POOL } from "src/database/database.constant";
import type {
  StartClassificationRunInput,
  FinishClassificationRunInput,
} from "./classification-runs.types";

@Injectable()
export class ClassificationRunsRepository {
  constructor(
    @Inject(DATABASE_POOL)
    private readonly pool: Pool,
  ) {}

  async create(input: StartClassificationRunInput): Promise<number> {
    const result = await this.pool.query<{ id: number }>(
      `
        INSERT INTO classification_runs (
          article_id,
          job_id,
          attempt,
          classifier_version
        )
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `,
      [input.articleId, input.jobId, input.attempt, input.classifierVersion],
    );

    return result.rows[0].id;
  }

  async finish(
    runId: number,
    input: FinishClassificationRunInput,
  ): Promise<void> {
    const classificationStatus =
      input.status === "SUCCESS" ? input.classificationStatus : null;

    const result = await this.pool.query(
      `
        UPDATE classification_runs
        SET
          status = $1,
          classification_status = $2,
          failure_stage = $3,
          failure_reason = $4,
          error_message = $5,
          finished_at = NOW()
        WHERE id = $6 AND status = 'RUNNING'
      `,
      [
        input.status,
        classificationStatus,
        input.failure?.stage ?? null,
        input.failure?.reason ?? null,
        input.failure?.message ?? null,
        runId,
      ],
    );

    if (result.rowCount !== 1) {
      throw new Error(
        `Classification run ${runId} was not updated: it does not exist or is already finished`,
      );
    }
  }
}
