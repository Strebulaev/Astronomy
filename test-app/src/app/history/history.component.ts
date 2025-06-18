import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestLoaderService } from '../services/test-loader.service';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';

interface TestHistoryItem {
  testName: string;
  date: Date;
  correctAnswers: number;
  incorrectAnswers: number;
  timeSpent: number;
  totalQuestions: number;
  testFile: string;
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    TableModule,
    CardModule
  ],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {
  testHistory: TestHistoryItem[] = [];

  constructor(
    private testLoader: TestLoaderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadHistory();
    this.createStars();
  }

  private createStars(): void {
    const count = 120;
    for (let i = 0; i < count; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.width = `${Math.random() * 3 + 1}px`;
      star.style.height = star.style.width;
      star.style.setProperty('--duration', `${Math.random() * 6 + 2}s`);
      document.querySelector('.history-container')?.appendChild(star);
    }
  }

  private loadHistory(): void {
    this.testHistory = this.testLoader.getHistory();
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  clearHistory(): void {
    this.testLoader.clearHistory();
    this.loadHistory();
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  navigateToTest(testFile: string): void {
    this.router.navigate(['/quiz', testFile]);
  }
}