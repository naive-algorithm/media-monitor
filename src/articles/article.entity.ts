export class Article {
  constructor(
    public readonly id: number | undefined,
    public readonly sourceId: number,
    public title: string,
    public description: string,
    public url: string,
    public externalId: string,
    public publishedAt: Date,
  ) {}
}
