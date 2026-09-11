import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { NewsIngestionModule } from "src/news-ingestion/news-ingestion.module";
import { NewsIngestionProcessor } from "src/news-ingestion/news-ingestion.processor";
import { QueueInfrastructureModule } from "src/queue-infrastructure/queue-infrastructure.module";
import { SourcesModule } from "src/sources/sources.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    NewsIngestionModule,
    SourcesModule,
    QueueInfrastructureModule,
  ],
  providers: [NewsIngestionProcessor],
})
export class AppWorkerModule {}
