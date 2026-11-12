import { Module } from "@nestjs/common";
import { DatabaseModule } from "src/database/database.module";
import { ClassificationRunsRepository } from "./classification-runs.repository";
import { ClassificationRunsService } from "./classification-runs.service";

@Module({
  imports: [DatabaseModule],
  providers: [ClassificationRunsRepository, ClassificationRunsService],
  exports: [ClassificationRunsService],
})
export class ClassificationRunsModule {}
