import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Test } from '../../models/test.model';
import { Router } from '@angular/router';
import { QuizDataService } from '../../services/quiz-data.service';
import { QuizData } from '../../models/quiz-data.model';

@Component({
  selector: 'app-theme-selector',
  templateUrl: './theme-selector.component.html',
  styleUrls: ['./theme-selector.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ThemeSelectorComponent implements OnInit {
  tests: Test[] = [];
  tags: any[] = [];
  selectedTest: Test | null = null;
  
  constructor(
    private dataService: DataService, 
    private router: Router, 
    private quizDataService: QuizDataService
  ) {}

  ngOnInit(): void {
    this.loadThematicTests();
  }

  loadTags(): void {
    this.dataService.getTags().subscribe((tags: any[]) => {
      this.tags = tags;
    });
  }

  loadThematicTests(): void {
    this.dataService.getAllTests().subscribe({
      next: (tests) => {
        this.tests = tests;
        // Восстанавливаем выбранный тест, если он остался в списке
        if (this.selectedTest) {
          this.selectedTest = this.tests.find(t => t.id === this.selectedTest?.id) || null;
        }
      },
      error: (err) => console.error('Error loading tests:', err)
    });
  }
  deleteTest(testId: string): void {
    if (confirm('Вы уверены, что хотите удалить этот тест?')) {
      this.dataService.deleteTest(testId).subscribe({
        next: (success) => {
          if (success) {
            this.loadThematicTests(); // Перезагружаем список
            if (this.selectedTest?.id === testId) {
              this.selectedTest = null; // Сбрасываем выбор, если удалён текущий
            }
          } else {
            console.error('Не удалось удалить тест');
          }
        },
        error: (err) => console.error('Ошибка при удалении:', err)
      });
    }
  }
  startTest(): void {
    if (this.selectedTest) {
      const quizData: QuizData = {
        name: this.selectedTest.name,
        testType: this.selectedTest.isCustom ? 'custom' : 'thematic',
        questions: this.selectedTest.questions.map(q => {
          const shuffledOptions = this.shuffleArray([...q.options]);
          
          return {
            question: q.question,
            options: shuffledOptions.map((o: { text: string }) => o.text),
            correctAnswers: shuffledOptions
              .map((o: { correct: boolean }, i: number) => o.correct ? i : -1)
              .filter((i: number) => i !== -1),
            multiple: shuffledOptions.filter((o: { correct: boolean }) => o.correct).length > 1,
            explanation: q.explanation
          };
        })
      };
      
      this.quizDataService.setQuizData(quizData);
      this.router.navigate(['/quiz']);
    }
  }
  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}