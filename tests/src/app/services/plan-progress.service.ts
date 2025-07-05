// src/app/services/plan-progress.service.ts
import { Injectable } from '@angular/core';

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

@Injectable({ providedIn: 'root' })
export class PlanProgressService {
  private readonly STORAGE_KEY = 'astronomy_progress';

  getProgress(): Topic[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  saveProgress(topics: Topic[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(topics));
  }
}