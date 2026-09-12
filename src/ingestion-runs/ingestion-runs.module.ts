import { Module } from "@nestjs/common";
import { IngestionRunsService } from "./ingestion-runs.service";
import { IngestionRunsRepository } from "./ingestion-runs.repository";
import { DatabaseModule } from "src/database/database.module";

@Module({
  imports: [DatabaseModule],
  providers: [IngestionRunsService, IngestionRunsRepository],
  exports: [IngestionRunsService],
})
export class IngestionRunsModule {}
