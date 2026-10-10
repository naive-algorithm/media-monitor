import { CollectionResult } from "./collection-result.types";

export abstract class Collector {
  abstract collect(url: string): Promise<CollectionResult>;
}
