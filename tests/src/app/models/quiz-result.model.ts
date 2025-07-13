// models/quiz-result.model.ts
export interface QuizResult {
  id: string;
  testName: string;
  testType: 'thematic' | 'custom' | 'olympiad';
  date: Date;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number; // in seconds
  details?: {
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[];
  maxScore: number;
  pdfUrl?: string;
  solutionUrl?: string;
  hasSolution?: boolean;
}