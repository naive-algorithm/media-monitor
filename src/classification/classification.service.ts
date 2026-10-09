import { Injectable } from "@nestjs/common";
import { ClassificationRepository } from "./classification.repository";
import { ArticleClassifier } from "./article-classifier.abstract";
import { ArticlesService } from "src/articles/articles.service";
import type {
  ArticleClassifierInput,
  ArticleClassifierResult,
} from "./classification.types";

import { ArticleClassificationError } from "./errors/article-classification.error";
import type { ClassificationStage } from "./errors/article-classification.error";

@Injectable()
export class ClassificationService {
  constructor(
    private readonly classificationRepository: ClassificationRepository,
    private readonly articlesService: ArticlesService,
    private readonly classifier: ArticleClassifier,
  ) {}

  async classifyArticle(articleId: number): Promise<ArticleClassifierResult> {
    let stage: ClassificationStage = "loading-article";

    try {
      const article = await this.articlesService.findById(articleId);

      const input: ArticleClassifierInput = {
        title: article.title,
        description: article.description,
      };

      stage = "classifying";

      const result: ArticleClassifierResult =
        await this.classifier.classify(input);

      stage = "saving-result";

      await this.classificationRepository.create(result, articleId);

      return result;
    } catch (error: unknown) {
      throw new ArticleClassificationError(articleId, stage, error);
    }
  }
}
