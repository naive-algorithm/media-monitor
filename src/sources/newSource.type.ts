import { CollectorType } from "./collector-type.enum";

export type NewSource = {
  name: string;
  url: string;
  collectorType: CollectorType;
  isEnabled: boolean;
};