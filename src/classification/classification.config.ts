// Select the target implementation for scheduling. This imports configuration,
// not the adapter or model runtime. Keep the module's DI binding consistent.
export { CLASSIFIER_VERSION as TARGET_CLASSIFIER_VERSION } from "./adapters/deberta/deberta-classifier.config";
