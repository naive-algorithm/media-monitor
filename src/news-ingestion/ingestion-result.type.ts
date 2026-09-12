export enum IngestionStatus {
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  PARTIAL = "PARTIAL",
}

export type IngestionStage =
  "collecting" | "saving-articles" | "updating-source-timestamp";

export type IngestionFailure =
  | {
      stage: IngestionStage;
      reason: "exception";
      cause: unknown;
    }
  | {
      stage: "collecting";
      reason: "all-items-rejected";
    };

export type IngestionCounts = {
  total: number | null;
  imported: number;
  skipped: number;
  rejected: number;
};

export type IngestionResult = IngestionCounts & (
    | {
        status: IngestionStatus.SUCCESS | IngestionStatus.PARTIAL;
        failure?: never;
    }
    | {
        status: IngestionStatus.FAILED;
        failure: IngestionFailure;
    }
)
