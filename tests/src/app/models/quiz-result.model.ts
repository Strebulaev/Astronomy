export interface QuizResult {
    id: string;
    testName: string;
    testType: 'thematic' | 'custom';
    date: Date;
    correctAnswers: number;
    totalQuestions: number;
    timeSpent: number; // in seconds
    details: {
      question: string;
      userAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
    }[];
  }