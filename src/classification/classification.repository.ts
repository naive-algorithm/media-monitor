import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { DATABASE_POOL } from "src/database/database.constant";
import type { ArticleClassifierResult } from "./classification.types";

@Injectable()
export class ClassificationRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async save(
    classificationResult: ArticleClassifierResult,
    articleId: number,
  ): Promise<void> {
    const client = await this.pool.connect();
    let discardClient = false;

    try {
      await client.query("BEGIN");

      const savedClassification = await client.query<{ id: number }>(
        `
          INSERT INTO article_classifications (
            article_id,
            classifier_version,
            status
          )
          VALUES ($1, $2, $3)
          ON CONFLICT (article_id, classifier_version)
          DO UPDATE SET
            status = EXCLUDED.status,
            classified_at = NOW()
          RETURNING id
        `,
        [
          articleId,
          classificationResult.classifierVersion,
          classificationResult.status,
        ],
      );

      const classificationRow = savedClassification.rows[0];

      if (!classificationRow) {
        throw new Error("Classification insert returned no row");
      }

      const classificationId = classificationRow.id;

      await client.query(
        `
          DELETE FROM article_classification_topics
          WHERE classification_id = $1
        `,
        [classificationId],
      );

      if (classificationResult.status === "CLASSIFIED") {
        for (const assignment of classificationResult.topics) {
          await client.query(
            `
              INSERT INTO article_classification_topics (
                classification_id,
                topic_code,
                score
              )
              VALUES ($1, $2, $3)
            `,
            [classificationId, assignment.topicCode, assignment.score],
          );
        }
      }

      await client.query("COMMIT");
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError: unknown) {
        discardClient = true;

        throw new AggregateError(
          [error, rollbackError],
          "Classification save failed; transaction rollback also failed",
        );
      }

      throw error;
    } finally {
      client.release(discardClient);
    }
  }
}
