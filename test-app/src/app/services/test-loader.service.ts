import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import * as yaml from 'yaml';

interface TestHistory {
  testName: string;
  date: Date;
  correctAnswers: number;
  incorrectAnswers: number;
  timeSpent: number;
  totalQuestions: number;
  testFile: string;
}

@Injectable({ providedIn: 'root' })
export class TestLoaderService {
  private readonly BASE_URL = 'assets/tests/';
  private history: any[] = [];

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.loadHistory();
  }

  private loadHistory(): void {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('testHistory');
      this.history = saved ? JSON.parse(saved) : [];
    }
  }

  private saveHistory(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('testHistory', JSON.stringify(this.history));
    }
  }

  addTestResult(result: Omit<TestHistory, 'date'>): void {
    this.history.unshift({
      ...result,
      date: new Date()
    });
    this.saveHistory();
  }

  getHistory(): TestHistory[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
    this.saveHistory();
  }

  getAvailableThemes(): Observable<{name: string, file: string}[]> {
    return this.http.get<{themes: {name: string, file: string}[]}>(`${this.BASE_URL}index.json`).pipe(
      map(response => response.themes || []),
      catchError(() => of([]))
    );
  }

  loadTest(filename: string): Observable<any[]> {
    return this.http.get(`${this.BASE_URL}${filename}`, { responseType: 'text' }).pipe(
      map(yamlText => yaml.parse(yamlText)),
      catchError(() => of([]))
    );
  }
}