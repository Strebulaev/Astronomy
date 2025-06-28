export interface Test {
    name: string;
    tags: string[];
    questions: {
      question: string;
      options: {
        text: string;
        correct: boolean;
      }[];
    }[];
  }