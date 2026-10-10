import { Test } from "@nestjs/testing";
import { ArticlesService } from "src/articles/articles.service";
import { ArticleClassifier } from "./article-classifier.abstract";
import { ClassificationRepository } from "./classification.repository";
import { ClassificationService } from "./classification.service";
import { ArticleClassificationError } from "./errors/article-classification.error";

describe("ClassificationService", () => {
  const result = { status: "UNCLASSIFIED", classifierVersion: "test-v1" };
  let service: ClassificationService;
  let findById: jest.Mock;
  let classify: jest.Mock;
  let save: jest.Mock;

  beforeEach(async () => {
    findById = jest
      .fn()
      .mockResolvedValue({ id: 42, title: "Title", description: null });
    classify = jest.fn().mockResolvedValue(result);
    save = jest.fn().mockResolvedValue(undefined);
    const module = await Test.createTestingModule({
      providers: [
        ClassificationService,
        { provide: ArticlesService, useValue: { findById } },
        { provide: ArticleClassifier, useValue: { classify } },
        { provide: ClassificationRepository, useValue: { save } },
      ],
    }).compile();
    service = module.get(ClassificationService);
  });

  it("loads the article, passes only text to the classifier and saves its result", async () => {
    await expect(service.classifyArticle(42)).resolves.toBe(result);
    expect(findById).toHaveBeenCalledWith(42);
    expect(classify).toHaveBeenCalledWith({
      title: "Title",
      description: null,
    });
    expect(save).toHaveBeenCalledWith(result, 42);
    expect(classify.mock.invocationCallOrder[0]).toBeLessThan(
      save.mock.invocationCallOrder[0],
    );
  });

  it.each(["loading-article", "classifying", "saving-result"] as const)(
    "preserves cause and stage for %s failures",
    async (stage) => {
      const cause = new Error("dependency failed");
      const failingMethod = {
        "loading-article": findById,
        classifying: classify,
        "saving-result": save,
      }[stage];
      failingMethod.mockRejectedValueOnce(cause);
      const promise = service.classifyArticle(42);
      await expect(promise).rejects.toBeInstanceOf(ArticleClassificationError);
      await expect(promise).rejects.toMatchObject({
        articleId: 42,
        stage,
        cause,
      });
      if (stage === "loading-article") expect(classify).not.toHaveBeenCalled();
      if (stage !== "saving-result") expect(save).not.toHaveBeenCalled();
    },
  );
});
