import { Source } from "src/sources/source.entity";
import { IngestionCounts } from "src/news-ingestion/ingestion-result.type";

export type StartIngestionRunInput = {
  sourceId: Source["id"];
  jobId: string;
  attempt: number;
};

export type FinishIngestionRunInput = IngestionCounts & {
  status: "SUCCESS" | "PARTIAL" | "FAILED" | "SKIPPED";
};
