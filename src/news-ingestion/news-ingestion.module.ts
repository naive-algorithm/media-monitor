import { NEWS_INGESTION_QUEUE_NAME } from "./news-ingestion.constants";
import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ArticlesModule } from "../articles/articles.module";
import { SourcesModule } from "../sources/sources.module";
import { NewsIngestionService } from "./news-ingestion.service";
import { NewsIngestionProducer } from "./news-ingestion.producer";
import { CollectorsModule } from "src/collectors/collectors.module";

@Module({
  imports: [
    ArticlesModule,
    SourcesModule,
    CollectorsModule,
    BullModule.registerQueue({ name: NEWS_INGESTION_QUEUE_NAME }),
  ],
  providers: [NewsIngestionService, NewsIngestionProducer],
  exports: [NewsIngestionService, NewsIngestionProducer],
})
export class NewsIngestionModule {}
