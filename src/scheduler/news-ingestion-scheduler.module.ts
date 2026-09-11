import { Module } from '@nestjs/common';
import { NewsIngestionScheduler } from './news-ingestion.scheduler';
import { NewsIngestionModule } from '../news-ingestion/news-ingestion.module';

@Module({
  imports: [NewsIngestionModule],
  providers: [NewsIngestionScheduler]
})
export class NewsIngestionSchedulerModule {}
