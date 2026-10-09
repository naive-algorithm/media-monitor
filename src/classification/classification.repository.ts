import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { DATABASE_POOL } from "src/database/database.constant";
import type { ArticleClassifierResult } from "./classification.types";

@Injectable()
export class ClassificationRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async create(
    classificationResult: ArticleClassifierResult,
    articleId: number,
  ): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      const insertedClassification = await client.query<{ id: number }>(
        `
          INSERT INTO article_classifications (
            article_id,
            classifier_version,
            status
          )
          VALUES ($1, $2, $3)
          RETURNING id
        `,
        [
          articleId,
          classificationResult.classifierVersion,
          classificationResult.status,
        ],
      );

      const classificationRow = insertedClassification.rows[0];

      if (!classificationRow) {
        throw new Error("Classification insert returned no row");
      }

      const classificationId = classificationRow.id;

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
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
