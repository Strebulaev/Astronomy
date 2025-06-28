export interface Question {
    id: string;
    tags: string[];
    text: string;
    difficulty: number;
    options: {
      text: string;
      correct: boolean;
    }[];
    explanation?: string;
  }