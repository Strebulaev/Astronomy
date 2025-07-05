// src/app/models/topic.model.ts
export interface Topic {
    id: string;
    title: string;
    difficulty: number;
    time: string;
    completed: boolean;
    completedDate: Date | null;
    notes: string;
    dueDate: Date;
    week: number;
    day: number;
    subtopics?: string[];
  }