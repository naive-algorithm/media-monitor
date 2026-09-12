import { Injectable } from "@nestjs/common";
import { IngestionRunsRepository } from "./ingestion-runs.repository";
import { StartIngestionRunInput, FinishIngestionRunInput } from "./ingestion-runs.type";

@Injectable()
export class IngestionRunsService {
    constructor(
        private readonly repository: IngestionRunsRepository
    ){}

    recordRunStart(input: StartIngestionRunInput): Promise<number> {
        return this.repository.create(input);
    }

    recordRunFinish(runId: number, input: FinishIngestionRunInput): Promise<void> {
        return this.repository.finish(runId, input);
    }
}
