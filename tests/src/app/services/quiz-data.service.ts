import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { QuizData } from '../models/quiz-data.model';

@Injectable({ providedIn: 'root' })
export class QuizDataService {
  private readonly STORAGE_KEY = 'current_quiz_data';
  private quizData: QuizData | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  setQuizData(data: QuizData): void {
    this.quizData = data;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }
  }

  getQuizData(): QuizData | null {
    if (this.quizData) return this.quizData;
    
    if (isPlatformBrowser(this.platformId)) {
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      return storedData ? JSON.parse(storedData) : null;
    }
    return null;
  }

  clearQuizData(): void {
    this.quizData = null;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}