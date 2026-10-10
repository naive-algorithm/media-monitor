// Changes affecting predictions require a new classifier version.
export const CLASSIFIER_VERSION = "0.1.0";
export const MODEL_ID = "MoritzLaurer/deberta-v3-base-zeroshot-v2.0";
export const MODEL_REVISION = "8e7e5af5983a0ddb1a5b45a38b129ab69e2258e8";
export const TOPIC_SCORE_THRESHOLD = 0.8;
export const MAX_DESCRIPTION_LENGTH = 1200;

export const MODEL_OPTIONS = {
  revision: MODEL_REVISION,
  dtype: "fp32",
  device: "cpu",
  session_options: { intraOpNumThreads: 1, interOpNumThreads: 1 },
} as const;

export const CLASSIFICATION_OPTIONS = {
  multi_label: true,
  hypothesis_template: "This article is about {}.",
};
