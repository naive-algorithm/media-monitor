import { Article } from "./article.entity";

export enum CreateArticleStatus {
  CREATED = "created",
  DUPLICATE = "duplicate",
}

export type CreateArticleResult =
  | { status: CreateArticleStatus.CREATED; article: Article }
  | { status: CreateArticleStatus.DUPLICATE };
