import { Source } from "src/sources/source.entity";
import { IngestionResult } from "./ingestion-result.type";

export type IngestSourceJobData = {
    sourceId: Source["id"];
};

export type IngestSourceJobResult =
  | {
      status: "SKIPPED";
      reason: "source-disabled";
      sourceId: Source["id"];
    }
  | {
      status: "PROCESSED";
      ingestion: IngestionResult;
    };
