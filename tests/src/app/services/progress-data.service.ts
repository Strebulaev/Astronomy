// src/app/services/progress-data.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProgressDataService {
  private progressSource = new BehaviorSubject<any>(null);
  currentProgress$ = this.progressSource.asObservable();

  updateProgress(data: any) {
    this.progressSource.next(data);
  }

  // Добавьте этот метод вместо getCurrentValue()
  getCurrentProgress() {
    return this.progressSource.value;
  }
}