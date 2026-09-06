import { Injectable, Logger } from "@nestjs/common";
import { RssService } from "src/rss/rss.service";
import { ArticlesService } from "src/articles/articles.service";
import { Article } from "src/articles/entities/article.entity";
import { Source } from "src/sources/source.entity";
import { SourcesService } from "src/sources/sources.service";
import { CreateArticleStatus } from "src/articles/types/create-article.type";

enum ImportStatus {
  SUCCESS = "success",
  FAILED = "failed",
}

type ImportStats = {
  total: number | null;
  imported: number;
  skipped: number;
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

  async importNews(source: Source): Promise<ImportStats> {
    const stats: ImportStats = {
      total: null,
      imported: 0,
      skipped: 0,
      status: ImportStatus.FAILED,
    };
    try {
      if (!source) {
        throw new Error("Source not found");
      }

      const news = await this.rssService.collect(source.url);

      stats.total = news.length;

      for (const item of news) {
        const article = new Article(
          undefined,
          source.id,
          item.title,
          item.description,
          item.url,
          item.externalId,
          item.publishedAt,
        );

        const result = await this.articlesService.create(article);
        if (result.status === CreateArticleStatus.CREATED) {
          stats.imported++;
        } else {
          stats.skipped++;
        }
      }

      await this.sourcesService.updateLastCollectedAt(source.id);

      stats.status = ImportStatus.SUCCESS;
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

  async importAll(): Promise<ImportResult[]> {
    const sources = await this.sourcesService.findEnabled();

    const results: ImportResult[] = [];

    for (const source of sources) {
      const stats = await this.importNews(source);
      results.push({ source: source.name, ...stats });
    }

    return results;
  }
}
