export interface TestOption {
    text: string;
    correct: boolean;
    explanation?: string;
  }
  
  export interface TestQuestion {
    question: string;
    options: TestOption[];
    difficulty?: number;
  }
  
  export interface TestTheme {
    name: string;
    description?: string;
    questions: TestQuestion[];
  }
  
  export interface TestData {
    tests: TestTheme[];
  }