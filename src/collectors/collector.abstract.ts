import { CollectionResult } from './collection-result.type';

export abstract class Collector {
  abstract collect(url: string): Promise<CollectionResult>;
}