import type { ArticleClassifierResult } from "../classification.types";
import type { ClassificationStage } from "../errors/article-classification.error";

export type ClassificationFailure = {
  stage: ClassificationStage;
  reason: string;
  message: string;
};

export type StartClassificationRunInput = {
  articleId: number;
  jobId: string;
  attempt: number;
  classifierVersion: string;
};

export type FinishClassificationRunInput =
  | {
      status: "SUCCESS";
      classificationStatus: ArticleClassifierResult["status"];
      failure?: never;
    }
  | {
      status: "FAILED";
      failure: ClassificationFailure;
    };
