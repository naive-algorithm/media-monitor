import {
  ArticleClassifierInput,
  ArticleClassifierResult,
} from "./classification.types";

export abstract class ArticleClassifier {
  abstract classify(
    input: ArticleClassifierInput,
  ): Promise<ArticleClassifierResult>;
}
