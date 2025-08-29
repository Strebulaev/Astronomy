import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { QuizResult } from '../models/quiz-result.model';

@Injectable({ providedIn: 'root' })
@Injectable({ providedIn: 'root' })
export class HistoryService {
  private readonly STORAGE_KEY = 'quiz_history';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  getHistory(): QuizResult[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    
    const historyJson = localStorage.getItem(this.STORAGE_KEY);
    if (!historyJson) return [];
    
    try {
      return JSON.parse(historyJson);
    } catch (e) {
      console.error('Error parsing history', e);
      return [];
    }
  }

  getHistoryBySubject(subjectId: string): QuizResult[] {
    return this.getHistory().filter(result => result.subjectId === subjectId);
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

  clearSubjectHistory(subjectId: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const history = this.getHistory().filter(item => item.subjectId !== subjectId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
  }

  removeResult(id: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const history = this.getHistory().filter(item => item.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
  }
}