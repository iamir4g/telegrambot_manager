export type FaqItem = {
  id: string;
  eventId: string;
  question: string;
  answer: string;
  topicKey: string;
  status: 'DRAFT' | 'APPROVED';
  sortOrder: number;
};

export type FaqFormValues = {
  question: string;
  answer: string;
  topicKey: string;
};
