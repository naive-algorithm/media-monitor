export const NEWS_INGESTION_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 2_000,
  },
  removeOnComplete: {
    age: 24 * 60 * 60,
    count: 1_000,
  },
  removeOnFail: {
    age: 7 * 24 * 60 * 60,
    count: 5_000,
  },
};
