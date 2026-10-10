import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { ConfigModule } from "@nestjs/config";
import { ArticlesModule } from "./articles/articles.module";
import { RssModule } from "./collectors/adapters/rss/rss.module";
import { SourcesModule } from "./sources/sources.module";
import { NewsIngestionModule } from "./news-ingestion/news-ingestion.module";
import { NewsIngestionSchedulerModule } from "./news-ingestion/scheduling/news-ingestion-scheduler.module";
import { CollectorsModule } from "./collectors/collectors.module";
import { QueueInfrastructureModule } from "./queue-infrastructure/queue-infrastructure.module";
import { IngestionRunsModule } from "./news-ingestion/runs/ingestion-runs.module";
import { ClassificationSchedulerModule } from "./classification/scheduling/classification-scheduler.module";

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
    IngestionRunsModule,
    ClassificationSchedulerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
