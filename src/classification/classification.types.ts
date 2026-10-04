export type ClassificationInput = {
  title: string;
  description: string | null;
};

export type TopicAssignment = {
  topicCode: string;
  score: number;
};

export type ClassificationResult =
  | {
      status: "CLASSIFIED";
      topics: [TopicAssignment, ...TopicAssignment[]];
      classifierVersion: string;
    }
  | {
      status: "UNCLASSIFIED";
      classifierVersion: string;
    };