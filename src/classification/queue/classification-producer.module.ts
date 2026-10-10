import { Module } from "@nestjs/common";
import { ArticlesModule } from "src/articles/articles.module";
import { ClassificationQueueModule } from "./classification-queue.module";
import { ClassificationProducer } from "./classification.producer";

// Safe to import in the API: no classifier adapter or model initialization.
// The process root supplies QueueInfrastructureModule and ConfigModule.
@Module({
  imports: [ArticlesModule, ClassificationQueueModule],
  providers: [ClassificationProducer],
  exports: [ClassificationProducer],
})
export class ClassificationProducerModule {}
