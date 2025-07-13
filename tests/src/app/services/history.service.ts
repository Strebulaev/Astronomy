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
    if (!historyJson) return [];
    
    try {
      return JSON.parse(historyJson).map((item: any) => ({
        ...item,
        date: new Date(item.date),
        // Добавляем поддержку новых полей при загрузке
        solutionUrl: item.solutionUrl || undefined,
        hasSolution: item.hasSolution || false
      }));
    } catch (e) {
      console.error('Error parsing history', e);
      return [];
    }
  }

  addResult(result: QuizResult): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const history = this.getHistory();
    // Добавляем поддержку новых полей при сохранении
    const resultToSave = {
      ...result,
      solutionUrl: result.solutionUrl || undefined,
      hasSolution: result.hasSolution || false
    };
    history.unshift(resultToSave);
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