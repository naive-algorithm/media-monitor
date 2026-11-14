import { Article } from "./article.entity";

export type ArticlesListItem = Pick<
  Article,
  "id" | "sourceId" | "title" | "description" | "url" | "publishedAt"
>;
