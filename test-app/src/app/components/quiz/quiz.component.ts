import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TestLoaderService } from '../../services/test-loader.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

interface Question {
  question: string;
  options: {
    text: string;
    correct: boolean;
  }[];
}

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RadioButtonModule,
    ButtonModule,
    ProgressSpinnerModule,
    ToastModule
  ],
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css'],
  providers: [MessageService]
})
export class QuizComponent implements OnInit, OnDestroy {
  @Input() testFile!: string;
  
  testName = '';
  questions: Question[] = [];
  currentQuestionIndex = 0;
  selectedOption: number | null = null;
  showResult = false;
  quizCompleted = false;
  score = 0;
  loading = true;
  error = false;
  startTime!: Date;
  timerInterval: any;
  timeSpent = 0; // в секундах

  constructor(
    private loader: TestLoaderService,
    private route: ActivatedRoute,
    private messageService: MessageService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadTest(this.testFile);
    this.route.paramMap.subscribe(params => {
      const testFile = params.get('testFile');
      if (testFile) {
        this.testFile = testFile;
        this.loadTest(testFile);
      }
    });
    this.createStars();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private createStars(): void {
    const count = 100;
    for (let i = 0; i < count; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.width = `${Math.random() * 3 + 1}px`;
      star.style.height = star.style.width;
      star.style.setProperty('--duration', `${Math.random() * 5 + 3}s`);
      document.querySelector('.quiz-container')?.appendChild(star);
    }
  }

  private startTimer(): void {
    this.startTime = new Date();
    this.timerInterval = setInterval(() => {
      this.timeSpent = Math.floor((new Date().getTime() - this.startTime.getTime()) / 1000);
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private resetQuizState(): void {
    this.testName = '';
    this.questions = [];
    this.currentQuestionIndex = 0;
    this.selectedOption = null;
    this.showResult = false;
    this.quizCompleted = false;
    this.score = 0;
    this.loading = true;
    this.error = false;
    this.timeSpent = 0;
    this.stopTimer();
  }

  loadTest(filename: string): void {
    this.resetQuizState();
    
    this.loader.loadTest(filename).subscribe({
      next: (tests) => {
        if (tests.length > 0 && tests[0].questions) {
          this.testName = tests[0].name;
          this.questions = tests[0].questions;
          this.startTimer();
        } else {
          this.showError('Тест не содержит вопросов');
        }
        this.loading = false;
      },
      error: (err) => {
        this.showError('Ошибка загрузки теста');
        this.loading = false;
        this.error = true;
      }
    });
  }

  submitAnswer(): void {
    if (this.selectedOption === null) return;
    
    this.showResult = true;
    if (this.questions[this.currentQuestionIndex].options[this.selectedOption].correct) {
      this.score++;
    }
  }

  nextQuestion(): void {
    this.showResult = false;
    this.selectedOption = null;
    
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
    } else {
      this.completeTest();
    }
  }

  private completeTest(): void {
    this.stopTimer();
    this.quizCompleted = true;
    
    this.loader.addTestResult({
      testName: this.testName,
      testFile: this.testFile,
      correctAnswers: this.score,
      incorrectAnswers: this.questions.length - this.score,
      timeSpent: this.timeSpent,
      totalQuestions: this.questions.length
    });
  }

  restartQuiz(): void {
    this.loadTest(this.testFile);
  }

  returnToMain(): void {
    this.router.navigate(['/']);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private showError(message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: message
    });
  }
}