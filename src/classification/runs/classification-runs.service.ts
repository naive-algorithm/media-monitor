import { Injectable } from "@nestjs/common";
import { ClassificationRunsRepository } from "./classification-runs.repository";
import type {
  StartClassificationRunInput,
  FinishClassificationRunInput,
} from "./classification-runs.types";

@Injectable()
export class ClassificationRunsService {
  constructor(private readonly repository: ClassificationRunsRepository) {}

  async recordRunStart(input: StartClassificationRunInput): Promise<number> {
    return this.repository.create(input);
  }

  async recordRunFinish(
    runId: number,
    input: FinishClassificationRunInput,
  ): Promise<void> {
    await this.repository.finish(runId, input);
  }
}
