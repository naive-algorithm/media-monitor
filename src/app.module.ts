import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { ConfigModule } from "@nestjs/config";
import { ArticlesModule } from "./articles/articles.module";
import { RssModule } from "./rss/rss.module";
import { SourcesModule } from "./sources/sources.module";
import { NewsIngestionModule } from "./news-ingestion/news-ingestion.module";
import { NewsIngestionSchedulerModule } from "./scheduler/news-ingestion-scheduler.module";
import { CollectorsModule } from "./collectors/collectors.module";
import { QueueInfrastructureModule } from './queue-infrastructure/queue-infrastructure.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    QueueInfrastructureModule,
    ArticlesModule,
    RssModule,
    SourcesModule,
    NewsIngestionModule,
    NewsIngestionSchedulerModule,
    CollectorsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
