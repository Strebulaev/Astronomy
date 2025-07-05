export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswers: number[];
  multiple: boolean;
  explanation?: string;
}

export interface QuizData {
  name: string;
  testType: 'thematic' | 'custom';
  questions: QuizQuestion[];
}