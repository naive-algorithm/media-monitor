import { Injectable, Logger } from "@nestjs/common";
import { ArticlesService } from "src/articles/articles.service";
import { Article } from "src/articles/entities/article.entity";
import { Source } from "src/sources/source.entity";
import { SourcesService } from "src/sources/sources.service";
import { CreateArticleStatus } from "src/articles/types/create-article.type";
import { CollectionResult } from "src/collectors/collection-result.type";
import { CollectorsRegistry } from "src/collectors/collectors.registry";

export enum IngestionStatus {
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  PARTIAL = "PARTIAL",
}

type IngestionStats = {
  total: number | null;
  imported: number;
  skipped: number;
  rejected: number;
  status: IngestionStatus;
};

@Injectable()
export class NewsIngestionService {
  private readonly logger: Logger = new Logger(NewsIngestionService.name);

  constructor(
    private readonly collectorsRegistry: CollectorsRegistry,
    private readonly articlesService: ArticlesService,
    private readonly sourcesService: SourcesService,
  ) {}

  async ingestFromSource(source: Source): Promise<IngestionStats> {
    const stats: IngestionStats = {
      total: null,
      imported: 0,
      skipped: 0,
      rejected: 0,
      status: IngestionStatus.FAILED,
    };

    try {
      if (!source) {
        throw new Error("Source not found");
      }

      const collectionResult: CollectionResult = await this.collectorsRegistry
        .getCollector(source.collectorType)
        .collect(source.url);

      stats.total = collectionResult.total;
      stats.rejected = collectionResult.rejected;

      const collectedItems = collectionResult.items;

      for (const item of collectedItems) {
        const article = new Article(
          undefined,
          source.id,
          item.title,
          item.description,
          item.url,
          item.externalId,
          item.publishedAt,
        );

        const creationResult = await this.articlesService.create(article);

        switch (creationResult.status) {
          case CreateArticleStatus.CREATED:
            stats.imported++;
            break;
          case CreateArticleStatus.DUPLICATE:
            stats.skipped++;
            break;
        }
      }

      if (stats.rejected === 0) {
        stats.status = IngestionStatus.SUCCESS;
      } else if (stats.rejected === stats.total) {
        stats.status = IngestionStatus.FAILED;
      } else {
        stats.status = IngestionStatus.PARTIAL;
      }

      if (stats.status !== IngestionStatus.FAILED) {
        await this.sourcesService.updateLastCollectedAt(source.id);
      }

      return stats;
    } catch (error) {
      this.logger.error(
        `Error importing news from source ${source?.name ?? "unknown"}:`,
        error,
      );
      stats.status = IngestionStatus.FAILED;
      return stats;
    }
  }
}
