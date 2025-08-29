export interface Subject {
    id: string;
    name: string;
    icon: string;
    color: string;
    planPath: string;
    questionsPath: string;
    tagsPath: string;
    testsPath: string;
    isActive: boolean;
    createdAt: Date;
    description?: string;
  }
  
  export interface SubjectConfig {
    planPath: string;
    questionsPath: string; 
    tagsPath: string;
    testsPath: string;
    custom?: boolean;
  }