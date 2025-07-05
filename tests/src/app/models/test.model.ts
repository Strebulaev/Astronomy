export interface Test {
  id?: string;  // Добавляем опциональный id
  name: string;
  tags: string[];
  questions: {
    question: string;
    options: {
      text: string;
      correct: boolean;
    }[];
    explanation?: string;
  }[];
  isCustom?: boolean;
}