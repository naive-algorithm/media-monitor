import { ClassificationInput, ClassificationResult } from "./classification.types";

export abstract class Classifier {
  abstract classify(input: ClassificationInput): Promise<ClassificationResult>;
}
