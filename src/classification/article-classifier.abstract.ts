import {
  ClassificationInput,
  ClassificationResult,
} from "./classification.types";

export abstract class ArticleClassifier {
  abstract classify(input: ClassificationInput): Promise<ClassificationResult>;
}
