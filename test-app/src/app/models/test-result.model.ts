export interface TestResult {
  testId: string;
  testName: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  date: string; // ISO date string
  timeSpent: number; // in seconds
  details: {
    questionId: string;
    isCorrect: boolean;
    timeSpent: number;
  }[];
}
