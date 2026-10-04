import { Injectable } from "@nestjs/common";
import { ArticleClassifier } from "../article-classifier.abstract";
import {
  ClassificationResult,
  ClassificationInput,
} from "../classification.types";

@Injectable()
export class DebertaClassifierAdapter extends ArticleClassifier {
  async classify(input: ClassificationInput): Promise<ClassificationResult> {
    throw new Error("Method not implemented.");
  }
}
