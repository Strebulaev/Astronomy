import { Component, OnInit } from '@angular/core';
import { HistoryService } from '../../services/history.service';
import { QuizResult } from '../../models/quiz-result.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { SubjectManagerService } from '../../services/subject-manager.service';
import { Subject } from '../../models/subject.model';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css'],
  imports: [CommonModule, FormsModule, MatIcon],
  standalone: true
})
export class HistoryComponent implements OnInit {
  results: QuizResult[] = [];
  filteredResults: QuizResult[] = [];
  selectedFilter: string = 'all';
  selectedSort: string = 'newest';
  selectedResult: QuizResult | null = null;
  currentSubject: Subject | null = null;

  constructor(
    private historyService: HistoryService,
    private subjectManager: SubjectManagerService
  ) {}

  ngOnInit(): void {
    this.subjectManager.getCurrentSubject().subscribe(subject => {
      this.currentSubject = subject;
      this.loadHistory();
    });
  }

  loadHistory(): void {
    if (this.currentSubject) {
      this.results = this.historyService.getHistoryBySubject(this.currentSubject.id);
    } else {
      this.results = this.historyService.getHistory();
    }
    this.applyFiltersAndSort();
  }

  applyFiltersAndSort(): void {
    // Фильтрация
    this.filteredResults = this.results.filter(result => {
      if (this.selectedFilter === 'all') return true;
      return result.testType === this.selectedFilter;
    });

    // Сортировка
    this.filteredResults.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      const percentageA = a.correctAnswers / a.totalQuestions;
      const percentageB = b.correctAnswers / b.totalQuestions;

      switch (this.selectedSort) {
        case 'newest': return dateB - dateA;
        case 'oldest': return dateA - dateB;
        case 'best': return percentageB - percentageA;
        case 'worst': return percentageA - percentageB;
        default: return 0;
      }
    });
  }

  showDetails(result: QuizResult): void {
    this.selectedResult = result;
  }

  closeDetails(): void {
    this.selectedResult = null;
  }

  restartTest(result: QuizResult): void {
    // Реализация будет добавлена после интеграции с сервисом тестов
    console.log('Restart test:', result);
  }

  deleteResult(id: string): void {
    this.historyService.removeResult(id);
    this.loadHistory();
  }

  clearHistory(): void {
    if (confirm('Вы уверены, что хотите очистить всю историю?')) {
      this.historyService.clearHistory();
      this.loadHistory();
    }
  }

  exportHistory(): void {
    const data = JSON.stringify(this.results, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'astronomy-quiz-history.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  getPercentage(result: QuizResult): number {
    return Math.round((result.correctAnswers / result.totalQuestions) * 100);
  }

  getResultColor(result: QuizResult): string {
    const percentage = this.getPercentage(result);
    if (percentage >= 80) return 'green';
    if (percentage >= 50) return 'orange';
    return 'red';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString('ru-RU');
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes} мин ${secs} сек`;
  }
}