import { Injectable } from '@angular/core';
import { TestResult } from '../models/test-result.model';

@Injectable({
  providedIn: 'root'
})
export class TestStorageService {
  private readonly STORAGE_KEY = 'test_results';

  saveTestResult(result: TestResult): void {
    const results = this.getAllTestResults();
    results.push(result);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(results));
  }

  getAllTestResults(): TestResult[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  getTestResultsByTestId(testId: string): TestResult[] {
    return this.getAllTestResults().filter(r => r.testId === testId);
  }

  clearTestResults(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
