import { Module } from '@nestjs/common';
import { ArticlesModule } from '../articles/articles.module';
import { SourcesModule } from '../sources/sources.module';
import { NewsImportService } from './news-import.service';
import { CollectorsModule } from 'src/collectors/collectors.module';

@Module({
  imports: [ArticlesModule, SourcesModule, CollectorsModule],
  providers: [NewsImportService],
  exports: [NewsImportService],
})
export class NewsImportModule {}
