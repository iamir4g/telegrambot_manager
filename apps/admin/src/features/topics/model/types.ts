export type TopicNode = {
  id: string;
  eventId: string;
  key: string;
  title: string;
  parentKey: string | null;
  keywordsJson: string;
  sampleQuestions: string;
  sortOrder: number;
};
