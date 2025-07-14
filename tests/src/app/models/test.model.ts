export interface Test {
  id?: string;
  name: string;
  tags: string[];
  questions: {
    question: string;
    options: {
      text: string;
      correct: boolean;
    }[];
    explanation?: string;
    difficulty?: number; // Добавляем необязательную сложность для вопросов
  }[];
  isCustom?: boolean;
  isCustomThematic?: boolean;
  questionCount?: number; // Добавим для удобства
  averageDifficulty?: number; // Добавим для удобства
}