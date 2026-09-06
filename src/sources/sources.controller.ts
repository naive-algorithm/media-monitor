import { Controller, Get, Post, Param, Body, ParseIntPipe, HttpCode } from "@nestjs/common";
import { SourcesService } from "./sources.service";
import { CreateSourceDto } from "./dto/create-source.dto";

@Controller("sources")
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}
  @Get()
  async findAll() {
    return this.sourcesService.findAll();
  }
  @Get("enabled")
  async findEnabled() {
    return this.sourcesService.findEnabled();
  }
  @Get(":id")
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.sourcesService.findById(id);
  }
  @Post()
    async create(@Body() dto: CreateSourceDto) {
    return this.sourcesService.create(dto);
  }
  @Post(":id/enable")
  @HttpCode(204)
    async enableSource(@Param('id', ParseIntPipe) id: number) {
    return await this.sourcesService.enableSource(id);
  }
  @Post(":id/disable")
  @HttpCode(204)
    async disableSource(@Param('id', ParseIntPipe) id: number) {
    return await this.sourcesService.disableSource(id);
  }
}
