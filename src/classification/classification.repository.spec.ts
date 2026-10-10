import { Pool } from "pg";
import { ClassificationRepository } from "./classification.repository";
import { ArticleClassifierResult } from "./classification.types";

describe("ClassificationRepository", () => {
  const classified: ArticleClassifierResult = {
    status: "CLASSIFIED",
    classifierVersion: "test-v1",
    topics: [
      { topicCode: "topic-a", score: 0.9 },
      { topicCode: "topic-b", score: 0.85 },
    ],
  };

  function setup() {
    const query = jest.fn().mockResolvedValue({ rows: [] });
    const release = jest.fn();
    const connect = jest.fn().mockResolvedValue({ query, release });
    // Only the Pool methods used by this repository are implemented by the double.
    const repository = new ClassificationRepository({
      connect,
    } as unknown as Pool);
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 7 }] });
    return { repository, query, release, connect };
  }

  it("saves the result and all assignments on one client before committing", async () => {
    const { repository, query, release, connect } = setup();
    await repository.create(classified, 42);
    expect(connect).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("INSERT INTO article_classifications"),
      [42, "test-v1", "CLASSIFIED"],
    );
    expect(query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("INSERT INTO article_classification_topics"),
      [7, "topic-a", 0.9],
    );
    expect(query).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining("INSERT INTO article_classification_topics"),
      [7, "topic-b", 0.85],
    );
    expect(query).toHaveBeenNthCalledWith(5, "COMMIT");
    expect(query).toHaveBeenCalledTimes(5);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it("persists UNCLASSIFIED without topic inserts", async () => {
    const { repository, query, release } = setup();
    await repository.create(
      { status: "UNCLASSIFIED", classifierVersion: "test-v1" },
      42,
    );
    expect(query).toHaveBeenNthCalledWith(2, expect.any(String), [
      42,
      "test-v1",
      "UNCLASSIFIED",
    ]);
    expect(query).toHaveBeenNthCalledWith(3, "COMMIT");
    expect(query).toHaveBeenCalledTimes(3);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it("rolls back a failed assignment, releases the client and preserves the error", async () => {
    const { repository, query, release } = setup();
    const error = new Error("insert failed");
    query.mockRejectedValueOnce(error);
    await expect(repository.create(classified, 42)).rejects.toBe(error);
    expect(query).toHaveBeenLastCalledWith("ROLLBACK");
    expect(query).not.toHaveBeenCalledWith("COMMIT");
    expect(release).toHaveBeenCalledTimes(1);
  });

  it("rolls back when the result insert returns no ID", async () => {
    const { repository, query, release } = setup();
    query.mockReset().mockResolvedValue({ rows: [] });
    await expect(repository.create(classified, 42)).rejects.toThrow(
      "Classification insert returned no row",
    );
    expect(query).toHaveBeenLastCalledWith("ROLLBACK");
    expect(release).toHaveBeenCalledTimes(1);
  });

  it("propagates connection failure without starting a transaction", async () => {
    const { repository, connect, query, release } = setup();
    const error = new Error("pool unavailable");
    connect.mockRejectedValueOnce(error);
    await expect(repository.create(classified, 42)).rejects.toBe(error);
    expect(query).not.toHaveBeenCalled();
    expect(release).not.toHaveBeenCalled();
  });
});
