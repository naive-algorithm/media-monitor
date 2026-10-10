import { Source } from "src/sources/source.entity";
import { IngestionCounts } from "src/news-ingestion/ingestion-result.types";

export type StartIngestionRunInput = {
  sourceId: Source["id"];
  jobId: string;
  attempt: number;
};

export type FinishIngestionRunInput = IngestionCounts & {
  status: "SUCCESS" | "PARTIAL" | "FAILED" | "SKIPPED";
  failure?: {
    stage: string;
    reason: string;
    message: string;
  };
};
