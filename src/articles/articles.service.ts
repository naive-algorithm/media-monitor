import { Injectable, NotFoundException } from '@nestjs/common';
import { Article } from './entities/article.entity';
import { ArticlesRepository } from './repositories/articles.repository';
import { CreateArticleResult } from './types/create-article.type';

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

  async create(article: Article): Promise<CreateArticleResult> {
    return this.articlesRepository.create(article);
  }

  async delete(id: number) {
    await this.findById(id);
    await this.articlesRepository.delete(id);
  }
}
