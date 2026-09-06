import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { NewsImportModule } from '../news-import/news-import.module';

@Module({
  imports: [NewsImportModule],
  providers: [SchedulerService]
})
export class SchedulerModule {}
