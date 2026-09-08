import { CollectionResult } from './collection-result.type';

export interface Collector {
    collect(url: string): Promise<CollectionResult>;
}