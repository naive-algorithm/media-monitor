import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ClassificationModule } from "src/classification/classification.module";
import { ClassificationQueueModule } from "src/classification/queue/classification-queue.module";
import { ClassificationProcessor } from "src/classification/queue/classification.processor";
import { QueueInfrastructureModule } from "src/queue-infrastructure/queue-infrastructure.module";
import { ClassificationRunsModule } from "src/classification/runs/classification-runs.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    QueueInfrastructureModule,
    ClassificationQueueModule,
    ClassificationModule,
    ClassificationRunsModule,
  ],
  providers: [ClassificationProcessor],
})
export class ClassificationWorkerModule {}
