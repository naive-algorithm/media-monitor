import { Injectable, Inject } from "@nestjs/common";
import { Article } from "./article.entity";
import { Pool } from "pg";
import { DATABASE_POOL } from "src/database/database.constant";
import {
  CreateArticleResult,
  CreateArticleStatus,
} from "./create-article.types";
@Injectable()
export class ArticlesRepository {
  constructor(@Inject(DATABASE_POOL) private pool: Pool) {}

  private mapRowToArticle(row: any): Article {
    return new Article(
      row.id,
      row.source_id,
      row.title,
      row.description,
      row.url,
      row.external_id,
      new Date(row.published_at),
    );
  }

  async findAll(): Promise<Article[]> {
    const result = await this.pool.query("SELECT * FROM articles");
    return result.rows.map((row) => this.mapRowToArticle(row));
  }

  async findById(id: number): Promise<Article | undefined> {
    const result = await this.pool.query(
      "SELECT * FROM articles WHERE id = $1",
      [id],
    );
    const row = result.rows[0];
    if (!row) {
      return undefined;
    }
    return this.mapRowToArticle(row);
  }

  async create(article: Article): Promise<CreateArticleResult> {
    const result = await this.pool.query(
      `
      INSERT INTO articles (
        source_id,
        title,
        description,
        url,
        external_id,
        published_at
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (external_id, source_id)
      DO NOTHING
      RETURNING *;
      `,
      [
        article.sourceId,
        article.title,
        article.description,
        article.url,
        article.externalId,
        article.publishedAt,
      ],
    );

    if (result.rowCount === 0) {
      return { status: CreateArticleStatus.DUPLICATE };
    }

    return {
      status: CreateArticleStatus.CREATED,
      article: this.mapRowToArticle(result.rows[0]),
    };
  }

  async delete(id: number) {
    await this.pool.query("DELETE FROM articles WHERE id = $1", [id]);
  }

  async findArticleIdsPendingClassification(
    classifierVersion: string,
    limit: number,
  ): Promise<number[]> {
    if (!classifierVersion.trim()) {
      throw new Error("Classifier version must not be empty");
    }
    if (!Number.isSafeInteger(limit) || limit < 1) {
      throw new RangeError(
        "Classification batch limit must be a positive integer",
      );
    }

    const result = await this.pool.query<{ id: number }>(
      `
        SELECT a.id
        FROM articles AS a
        WHERE NOT EXISTS (
          SELECT 1
          FROM article_classifications AS c
          WHERE c.article_id = a.id
            AND c.classifier_version = $1
        )
        ORDER BY a.id
        LIMIT $2
      `,
      [classifierVersion, limit],
    );

    return result.rows.map((row) => row.id);
  }
}
