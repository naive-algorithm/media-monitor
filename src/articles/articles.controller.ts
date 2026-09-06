import { Controller, Get, Delete, ParseIntPipe, Param, HttpCode } from '@nestjs/common';
import { ArticlesService } from './articles.service';


@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}
  @Get()
  findAll() {
    return this.articlesService.findAll();
  }
  @Get(':id')
  findById(@Param ('id', ParseIntPipe) id: number) {
    return this.articlesService.findById(id);
  }
  @Delete(':id')
  @HttpCode(204)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.articlesService.delete(id);
  }
}
