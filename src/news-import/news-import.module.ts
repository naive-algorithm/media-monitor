import { Module } from '@nestjs/common';
import { ArticlesModule } from '../articles/articles.module';
import { SourcesModule } from '../sources/sources.module';
import { RssModule } from '../rss/rss.module';
import { NewsImportService } from './news-import.service';

@Module({
  imports: [ArticlesModule, SourcesModule, RssModule],
  providers: [NewsImportService],
  exports: [NewsImportService],
})
export class NewsImportModule {}
