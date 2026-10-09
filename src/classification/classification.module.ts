import { Module } from "@nestjs/common";
import { DebertaClassifierAdapter } from "./adapters/deberta/deberta-classifier.adapter";
import { ArticleClassifier } from "./article-classifier.abstract";
import { ClassificationService } from "./classification.service";
import { DatabaseModule } from "src/database/database.module";
import { ClassificationRepository } from "./classification.repository";
import { ArticlesModule } from "src/articles/articles.module";

@Module({
  imports: [DatabaseModule, ArticlesModule],
  providers: [
    {
      provide: ArticleClassifier,
      useClass: DebertaClassifierAdapter,
    },
    ClassificationService,
    ClassificationRepository,
  ],
  exports: [ArticleClassifier, ClassificationService],
})
export class ClassificationModule {}
