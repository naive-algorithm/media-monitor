export type ClassificationStage =
  "loading-article" | "classifying" | "saving-result";

export class ArticleClassificationError extends Error {
  constructor(
    public readonly articleId: number,
    public readonly stage: ClassificationStage,
    public readonly cause: unknown,
  ) {
    super(`Classification failed for article ${articleId} at stage "${stage}"`);
    this.name = "ArticleClassificationError";
  }
}
