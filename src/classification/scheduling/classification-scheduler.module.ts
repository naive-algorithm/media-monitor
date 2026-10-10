import { Module } from "@nestjs/common";
import { ClassificationProducerModule } from "../queue/classification-producer.module";
import { ClassificationScheduler } from "./classification.scheduler";

@Module({
  imports: [ClassificationProducerModule],
  providers: [ClassificationScheduler],
})
export class ClassificationSchedulerModule {}
