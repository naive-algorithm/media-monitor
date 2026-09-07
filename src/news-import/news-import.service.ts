import { Injectable, Logger } from "@nestjs/common";
import { RssService } from "src/rss/rss.service";
import { ArticlesService } from "src/articles/articles.service";
import { Article } from "src/articles/entities/article.entity";
import { Source } from "src/sources/source.entity";
import { SourcesService } from "src/sources/sources.service";
import { CreateArticleStatus } from "src/articles/types/create-article.type";
import { CollectionResult } from "src/rss/rss.service";

enum ImportStatus {
  SUCCESS = "success",
  FAILED = "failed",
  PARTIAL = "partial",
}

type ImportStats = {
  total: number | null;
  imported: number;
  skipped: number;
  rejected: number;
  status: ImportStatus;
};

type ImportResult = { source: string } & ImportStats;

@Injectable()
export class NewsImportService {
  private readonly logger: Logger = new Logger(NewsImportService.name);

  constructor(
    private readonly rssService: RssService,
    private readonly articlesService: ArticlesService,
    private readonly sourcesService: SourcesService,
  ) {}

  async importSource(source: Source): Promise<ImportStats> {
    const stats: ImportStats = {
      total: null,
      imported: 0,
      skipped: 0,
      rejected: 0,
      status: ImportStatus.FAILED,
    };

    try {
      if (!source) {
        throw new Error("Source not found");
      }

      const collectionResult: CollectionResult = await this.rssService.collect(
        source.url,
      );

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
        if (creationResult.status === CreateArticleStatus.CREATED) {
          stats.imported++;
        } else {
          stats.skipped++;
        }
      }

      if (stats.rejected === 0) {
        stats.status = ImportStatus.SUCCESS;
      } else if (stats.rejected === stats.total) {
        stats.status = ImportStatus.FAILED;
      } else {
        stats.status = ImportStatus.PARTIAL;
      }

      if (stats.status !== ImportStatus.FAILED) {
        await this.sourcesService.updateLastCollectedAt(source.id);
      }

      return stats;
    } catch (error) {
      this.logger.error(
        `Error importing news from source ${source?.name ?? "unknown"}:`,
        error,
      );
      stats.status = ImportStatus.FAILED;
      return stats;
    }
  }

  async importEnabledSources(): Promise<ImportResult[]> {
    const sources = await this.sourcesService.findEnabled();

    const results: ImportResult[] = [];

    for (const source of sources) {
      const stats = await this.importSource(source);
      results.push({ source: source.name, ...stats });
    }

    return results;
  }
}
