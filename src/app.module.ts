import { Module } from '@nestjs/common';
import { ArticlesModule } from './articles/articles.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { RssModule } from './rss/rss.module';
import { SourcesModule } from './sources/sources.module';
import { NewsImportModule } from './news-import/news-import.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { CollectorsModule } from './collectors/collectors.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ArticlesModule,
    RssModule,
    SourcesModule,
    NewsImportModule,
    SchedulerModule,
    CollectorsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
