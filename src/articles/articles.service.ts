import { Injectable, NotFoundException } from "@nestjs/common";
import { Article } from "./article.entity";
import { ArticlesRepository } from "./articles.repository";
import { CreateArticleResult } from "./create-article.types";
import { ArticlesListItem } from "./articles.types";

function toArticlesListItem(article: Article): ArticlesListItem {
  return {
    id: article.id,
    sourceId: article.sourceId,
    title: article.title,
    description: article.description,
    url: article.url,
    publishedAt: article.publishedAt,
  };
}

@Injectable()
export class ArticlesService {
  constructor(private readonly articlesRepository: ArticlesRepository) {}

  async findAll(): Promise<Article[]> {
    return this.articlesRepository.findAll();
  }

  async findById(id: number): Promise<Article> {
    const article = await this.articlesRepository.findById(id);
    if (!article) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }
    return article;
  }

  async findByTopic(
    topicCode: string,
    classifierVersion: string,
    limit: number,
  ): Promise<ArticlesListItem[]> {
    const articles = await this.articlesRepository.findByTopic(
      topicCode,
      classifierVersion,
      limit,
    );

    return articles.map(toArticlesListItem);
  }

  async findArticleIdsPendingClassification(
    classifierVersion: string,
    limit: number,
  ): Promise<number[]> {
    return this.articlesRepository.findArticleIdsPendingClassification(
      classifierVersion,
      limit,
    );
  }

  async create(article: Article): Promise<CreateArticleResult> {
    return this.articlesRepository.create(article);
  }

  async delete(id: number) {
    await this.findById(id);
    await this.articlesRepository.delete(id);
  }
}
