export type ArticleClassifierInput = {
  title: string;
  description: string | null;
};

export type TopicAssignment = {
  topicCode: string;
  score: number;
};

export type ArticleClassifierResult =
  | {
      status: "CLASSIFIED";
      topics: [TopicAssignment, ...TopicAssignment[]];
      classifierVersion: string;
    }
  | {
      status: "UNCLASSIFIED";
      classifierVersion: string;
    };