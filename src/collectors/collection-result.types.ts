import { CollectedItem } from "./collected-item.interface";

export type CollectionResult = {
  items: CollectedItem[];
  total: number;
  rejected: number;
};
