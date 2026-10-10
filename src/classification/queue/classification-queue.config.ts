import type { JobsOptions } from "bullmq";

// Bounds the candidate query, not the total queue size or worker throughput.
export const CLASSIFICATION_BATCH_SIZE = 350;

export const ARTICLE_CLASSIFICATION_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 2_000,
  },
  removeOnComplete: {
    age: 24 * 60 * 60,
    count: 1_000,
  },
  // Retry/remove explicitly after diagnosis; cron must not reset the retry budget.
  removeOnFail: false,
} satisfies JobsOptions;
