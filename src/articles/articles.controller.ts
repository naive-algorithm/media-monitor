import {
  Controller,
  Get,
  Delete,
  ParseIntPipe,
  Param,
  HttpCode,
  Query,
} from "@nestjs/common";
import { ArticlesService } from "./articles.service";
import { FindArticlesByTopicDto } from "./dto/find-articles-by-topic.dto";

@Controller("articles")
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}
  @Get(":id")
  findById(@Param("id", ParseIntPipe) id: number) {
    return this.articlesService.findById(id);
  }

  @Get()
  findArticlesByTopic(@Query() query: FindArticlesByTopicDto) {
    return this.articlesService.findByTopic(
      query.topicCode,
      query.classifierVersion,
      query.limit,
    );
  }

  @Delete(":id")
  @HttpCode(204)
  delete(@Param("id", ParseIntPipe) id: number) {
    return this.articlesService.delete(id);
  }
}
