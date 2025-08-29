export interface QuizResult {
  id: string;
  subjectId: string; // Добавляем привязку к предмету
  subjectName: string;
  testName: string;
  testType: 'thematic' | 'custom' | 'olympiad';
  date: Date;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  maxScore?: number;
  details?: {
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[];
  pdfUrl?: string;
  solutionUrl?: string;
  hasSolution?: boolean;
}