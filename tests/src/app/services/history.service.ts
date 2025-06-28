// app/services/history.service.ts
import { Injectable } from '@angular/core';
import { QuizResult } from '../models/quiz-result.model';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private readonly STORAGE_KEY = 'astronomy_quiz_history';

  constructor() {}

  getHistory(): QuizResult[] {
    const historyJson = localStorage.getItem(this.STORAGE_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
  }

  addResult(result: QuizResult): void {
    const history = this.getHistory();
    history.unshift(result);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
  }

  clearHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  removeResult(id: string): void {
    const history = this.getHistory().filter(item => item.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
  }
}