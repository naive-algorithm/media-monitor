import { Pool } from "pg";
import { CollectorType } from "src/collectors/collector-type.enum";
import { Source } from "./source.entity";
import { SourcesRepository } from "./sources.repository";

describe("SourcesRepository.findByName", () => {
  it("returns undefined for a missing source", async () => {
    const query = jest.fn().mockResolvedValue({ rows: [] });
    const repository = new SourcesRepository({ query } as unknown as Pool);

    await expect(repository.findByName("Missing")).resolves.toBeUndefined();
    expect(query).toHaveBeenCalledWith(
      "SELECT * FROM sources WHERE name = $1",
      ["Missing"],
    );
  });

  it("maps a matching row to a source", async () => {
    const query = jest.fn().mockResolvedValue({
      rows: [
        {
          id: 1,
          name: "Example",
          url: "https://example.com/rss",
          collector_type: CollectorType.RSS,
          is_enabled: true,
          last_collected_at: null,
        },
      ],
    });
    const repository = new SourcesRepository({ query } as unknown as Pool);

    await expect(repository.findByName("Example")).resolves.toEqual(
      new Source(
        1,
        "Example",
        "https://example.com/rss",
        CollectorType.RSS,
        true,
        null,
      ),
    );
  });
});
