import { CollectorType } from '../collectors/collector-type.enum';

export class Source {
  constructor(
    public readonly id: number,
    public name: string,
    public url: string,
    public collectorType: CollectorType,
    public isEnabled: boolean,
    public lastCollectedAt: Date | null,
  ) {}
}