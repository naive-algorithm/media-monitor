import { Injectable } from "@nestjs/common";
import { ArticlesService } from "src/articles/articles.service";
import { Article } from "src/articles/entities/article.entity";
import { Source } from "src/sources/source.entity";
import { SourcesService } from "src/sources/sources.service";
import { CreateArticleStatus } from "src/articles/types/create-article.type";
import { CollectionResult } from "src/collectors/collection-result.type";
import { CollectorsRegistry } from "src/collectors/collectors.registry";
import {
  IngestionCounts,
  IngestionStatus,
  IngestionResult,
  IngestionStage,
} from "./ingestion-result.type";

@Injectable()
export class NewsIngestionService {
  constructor(
    private readonly collectorsRegistry: CollectorsRegistry,
    private readonly articlesService: ArticlesService,
    private readonly sourcesService: SourcesService,
  ) {}

  async ingestFromSource(source: Source): Promise<IngestionResult> {
    const stats: IngestionCounts = {
      total: null,
      imported: 0,
      skipped: 0,
      rejected: 0,
    };

    let stage: IngestionStage = "collecting";

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

      stage = "saving-articles";

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

      let result: IngestionResult;

      if (stats.rejected === 0) {
        result = { ...stats, status: IngestionStatus.SUCCESS };
      } else if (stats.rejected === stats.total) {
        result = {
          ...stats,
          status: IngestionStatus.FAILED,
          failure: {
            stage: "collecting",
            reason: "all-items-rejected",
          },
        };
      } else {
        result = { ...stats, status: IngestionStatus.PARTIAL };
      }

      if (result.status !== IngestionStatus.FAILED) {
        stage = "updating-source-timestamp";
        await this.sourcesService.updateLastCollectedAt(source.id);
      }

      return result;
    } catch (error) {
      return {
        ...stats,
        status: IngestionStatus.FAILED,
        failure: {
          stage,
          reason: "exception",
          cause: error,
        },
      };
    }
  }
}
