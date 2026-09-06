export class Source {
  constructor(
    public readonly id: number,
    public name: string,
    public url: string,
    public collectorType: string,
    public isEnabled: boolean,
    public lastCollectedAt: Date | null,
  ) {}
}