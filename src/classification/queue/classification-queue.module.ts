import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ARTICLE_CLASSIFICATION_QUEUE_NAME } from "./classification.constants";

@Module({
  imports: [
    BullModule.registerQueue({ name: ARTICLE_CLASSIFICATION_QUEUE_NAME }),
  ],
  exports: [BullModule],
})
export class ClassificationQueueModule {}
