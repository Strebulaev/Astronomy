import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { QuizResult } from '../models/quiz-result.model';

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private readonly STORAGE_KEY = 'astronomy_quiz_history';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  getHistory(): QuizResult[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    
    const historyJson = localStorage.getItem(this.STORAGE_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
  }

  addResult(result: QuizResult): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const history = this.getHistory();
    history.unshift(result);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
  }

  clearHistory(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.removeItem(this.STORAGE_KEY);
  }

  removeResult(id: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const history = this.getHistory().filter(item => item.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
  }
}