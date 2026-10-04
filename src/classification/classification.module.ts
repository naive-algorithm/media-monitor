import { Module } from "@nestjs/common";
import { DebertaClassifierAdapter } from "./adapters/deberta-classifier.adapter";
import { ArticleClassifier } from "./article-classifier.abstract";

@Module({
  providers: [
    {
      provide: ArticleClassifier,
      useClass: DebertaClassifierAdapter,
    },
  ],
  exports: [ArticleClassifier],
})
export class ClassificationModule {}
