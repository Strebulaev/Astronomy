import { Injectable } from '@angular/core';
import * as yaml from 'js-yaml';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { Question } from '../models/question.model';
import { Test } from '../models/test.model';
import { TagCategory } from '../models/tag.model';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private readonly TESTS_PATH = '/assets/data/tests/';
  private readonly CUSTOM_TESTS_KEY = 'custom_tests';

  constructor(private http: HttpClient) {}

  getQuestions(): Observable<Question[]> {
    return this.http.get('/assets/data/questions.yml', { responseType: 'text' }).pipe(
      map(yamlText => {
        try {
          return yaml.load(yamlText) as Question[];
        } catch (e) {
          console.error('Error parsing YAML', e);
          return [];
        }
      }),
      catchError(err => {
        console.error('Error loading questions', err);
        return of([]);
      })
    );
  }

  getTags(): Observable<TagCategory[]> {
    return this.http.get('/assets/data/tags.yml', { responseType: 'text' }).pipe(
      map(yamlText => {
        try {
          return yaml.load(yamlText) as TagCategory[];
        } catch (e) {
          console.error('Error parsing tags YAML', e);
          return [];
        }
      }),
      catchError(err => {
        console.error('Error loading tags', err);
        return of([]);
      })
    );
  }

  getThematicTests(): Observable<Test[]> {
    return this.http.get<string[]>('/assets/data/tests/index.json').pipe(
      switchMap(testFiles => {
        const requests = testFiles.map(file => 
          this.http.get(`/assets/data/tests/${file}`, { responseType: 'text' })
            .pipe(
              map(text => {
                const test = yaml.load(text) as Test;
                test.isCustom = false;
                
                // Вычисляем среднюю сложность, если есть данные
                if (test.questions.some(q => q.difficulty !== undefined)) {
                  const sum = test.questions.reduce((acc, q) => acc + (q.difficulty || 0), 0);
                  test.averageDifficulty = Math.round(sum / test.questions.length);
                }
                
                test.questionCount = test.questions.length;
                
                return test;
              }),
              catchError(err => of(null))
        ));
        return forkJoin(requests).pipe(
          map(tests => tests.filter(t => t !== null) as Test[])
        );
      })
    );
  }
  deleteTest(testId: string): Observable<boolean> {
    try {
      const customTests = this.getCustomTests();
      const updatedTests = customTests.filter(t => t.id !== testId);
      localStorage.setItem(this.CUSTOM_TESTS_KEY, JSON.stringify(updatedTests));
      return of(true);
    } catch (error) {
      console.error('Error deleting test:', error);
      return of(false);
    }
  }
  saveCustomTest(test: Test): void {
    // Вычисляем сложность для кастомных тестов
    if (test.questions.some(q => q.difficulty !== undefined)) {
      const sum = test.questions.reduce((acc, q) => acc + (q.difficulty || 0), 0);
      test.averageDifficulty = Math.round(sum / test.questions.length);
    }
    test.questionCount = test.questions.length;
    
    const customTests = this.getCustomTests();
    const existingIndex = test.id ? customTests.findIndex(t => t.id === test.id) : -1;
    
    if (existingIndex >= 0) {
      customTests[existingIndex] = test;
    } else {
      customTests.push(test);
    }
    
    localStorage.setItem(this.CUSTOM_TESTS_KEY, JSON.stringify(customTests));
  }

  getCustomTests(): Test[] {
    const testsJson = localStorage.getItem(this.CUSTOM_TESTS_KEY);
    return testsJson ? JSON.parse(testsJson) : [];
  }

  getAllTests(): Observable<Test[]> {
    return this.getThematicTests().pipe(
      map(thematicTests => {
        const customTests = this.getCustomTests();
        return [...thematicTests, ...customTests];
      })
    );
  }
}