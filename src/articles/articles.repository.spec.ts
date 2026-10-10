import { Pool } from "pg";
import { ArticlesRepository } from "./articles.repository";

describe("ArticlesRepository.findArticleIdsPendingClassification", () => {
  function setup() {
    const query = jest.fn().mockResolvedValue({ rows: [{ id: 7 }, { id: 8 }] });
    return {
      query,
      repository: new ArticlesRepository({ query } as unknown as Pool),
    };
  }

  it("returns IDs and parameterizes the exact version and limit", async () => {
    const { query, repository } = setup();
    await expect(
      repository.findArticleIdsPendingClassification("v2", 50),
    ).resolves.toEqual([7, 8]);
    const [sql, parameters] = query.mock.calls[0];
    expect(parameters).toEqual(["v2", 50]);
    expect(sql).toContain("NOT EXISTS");
    expect(sql).toContain("c.classifier_version = $1");
    expect(sql).toContain("c.article_id = a.id");
    expect(sql).toContain("ORDER BY a.id");
    expect(sql).toContain("LIMIT $2");
    expect(sql).not.toContain("c.status");
  });

  it.each([0, -1, 1.5, NaN, Infinity])(
    "rejects invalid limit %s before querying",
    async (limit) => {
      const { query, repository } = setup();
      await expect(
        repository.findArticleIdsPendingClassification("v1", limit),
      ).rejects.toThrow(RangeError);
      expect(query).not.toHaveBeenCalled();
    },
  );

  it("rejects an empty version before querying", async () => {
    const { query, repository } = setup();
    await expect(
      repository.findArticleIdsPendingClassification("  ", 10),
    ).rejects.toThrow("version must not be empty");
    expect(query).not.toHaveBeenCalled();
  });
});
