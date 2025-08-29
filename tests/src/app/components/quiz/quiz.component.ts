import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { QuizDataService } from '../../services/quiz-data.service';
import { QuizData, QuizQuestion } from '../../models/quiz-data.model';
import { QuizResult } from '../../models/quiz-result.model';
import { HistoryService } from '../../services/history.service';
import { TimePipe } from "../../shared/time.pipe";
import { Pipe, PipeTransform } from '@angular/core';
import { SubjectManagerService } from '../../services/subject-manager.service';
import { Subject } from '../../models/subject.model';

interface QuestionOption {
  text: string;
  correct: boolean;
} 
interface Question {
  question: string;
  options: string[];
  correctAnswers: number[];
  multiple: boolean;
  explanation?: string;
}

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, TimePipe],
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css']
})
export class QuizComponent implements OnInit {
  quizData: QuizData | null = null;
  currentQuestionIndex = 0;
  selectedAnswers: (number | number[] | null)[] = [];
  quizComplete = false;
  score: number | null = null;
  showResults = false;
  private startTime: number = 0;
  private timerInterval: any;
  public timeSpent: number = 0;
  explanations: (string | null)[] = [];

  answerSubmitted = false;
  timerRunning = false;
  answerLocked = false;
  confirmedAnswers: boolean[] = [];
  currentSubject: Subject | null = null;

  constructor(
    public route: ActivatedRoute,
    private quizDataService: QuizDataService,
    public router: Router,
    private historyService: HistoryService,
    private subjectManager: SubjectManagerService
  ) {}

  ngOnInit(): void {
    this.startTimer();
    this.quizData = this.quizDataService.getQuizData();
    
    this.subjectManager.getCurrentSubject().subscribe(subject => {
      this.currentSubject = subject;
    });

    if (!this.quizData) {
      console.error('No quiz data provided');
      this.router.navigate(['/']);
      return;
    }
  
    this.selectedAnswers = new Array(this.quizData.questions.length).fill(null);
    this.confirmedAnswers = new Array(this.quizData.questions.length).fill(false); // Инициализируем
    this.explanations = new Array(this.quizData?.questions.length ?? 0).fill(null);
  }

  private startTimer(): void {
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      this.timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
    }, 1000);
  }
  confirmAnswer(): void {
    if (this.selectedAnswers[this.currentQuestionIndex] !== null) {
      this.confirmedAnswers[this.currentQuestionIndex] = true;
      this.showCurrentExplanation();
    }
  }
  checkAndShowExplanation(): void {
    if (this.selectedAnswers[this.currentQuestionIndex] !== null) {
      this.showCurrentExplanation();
    }
  }
  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.quizDataService.clearQuizData();
  }

  get currentQuestion(): QuizQuestion | null {
    return this.quizData?.questions[this.currentQuestionIndex] ?? null;
  }

  get progress(): number {
    return this.quizData ? ((this.currentQuestionIndex + 1) / this.quizData.questions.length) * 100 : 0;
  }

  selectAnswer(index: number): void {
    if (!this.currentQuestion || this.confirmedAnswers[this.currentQuestionIndex]) return;
  
    if (this.currentQuestion.multiple) {
      const currentSelection = this.selectedAnswers[this.currentQuestionIndex] as number[] || [];
      const answerIndex = currentSelection.indexOf(index);
      
      if (answerIndex > -1) {
        currentSelection.splice(answerIndex, 1);
      } else {
        currentSelection.push(index);
      }
      
      this.selectedAnswers[this.currentQuestionIndex] = currentSelection.length ? currentSelection : null;
    } else {
      this.selectedAnswers[this.currentQuestionIndex] = index;
      // Показываем объяснение сразу для одиночного выбора
    }
  }
  private showCurrentExplanation(): void {
    if (!this.quizData || !this.currentQuestion) return;
    
    const question = this.quizData.questions[this.currentQuestionIndex];
    if (question.explanation) {
      this.explanations[this.currentQuestionIndex] = question.explanation;
    } else {
      this.explanations[this.currentQuestionIndex] = null;
    }
  }
  isSelected(index: number): boolean {
    if (!this.currentQuestion) return false;
    
    const currentSelection = this.selectedAnswers[this.currentQuestionIndex];
    if (currentSelection === null) return false;

    return this.currentQuestion.multiple 
      ? (currentSelection as number[]).includes(index)
      : currentSelection === index;
  }

  nextQuestion(): void {
    if (!this.quizData) return;
  
    if (this.currentQuestionIndex < this.quizData.questions.length - 1) {
      this.currentQuestionIndex++;
      // Показываем объяснение если вопрос уже отвечен
      if (this.selectedAnswers[this.currentQuestionIndex] !== null) {
        this.showCurrentExplanation();
      }
    } else {
      this.completeQuiz();
    }
  }
  prevQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      // Показываем объяснение если вопрос уже отвечен
      if (this.selectedAnswers[this.currentQuestionIndex] !== null) {
        this.showCurrentExplanation();
      }
    }
  }
  completeQuiz(): void {
    this.stopTimer();
    this.quizComplete = true;
    
    if (!this.quizData || !this.currentSubject) return;
    
    this.score = this.calculateScore();
    
    const result: QuizResult = {
      id: generateId(),
      subjectId: this.currentSubject.id,
      subjectName: this.currentSubject.name,
      testName: this.quizData.name,
      testType: this.quizData.testType,
      date: new Date(),
      correctAnswers: this.getCorrectAnswersCount(),
      totalQuestions: this.quizData.questions.length,
      timeSpent: this.timeSpent,
      details: this.getDetailedResults()
    };
    
    this.historyService.addResult(result);
  }
  
  private getCorrectAnswersCount(): number {
    if (!this.quizData) return 0;
    let correct = 0;
    
    this.quizData.questions.forEach((question, index) => {
      if (this.isAnswerCorrect(index)) {
        correct++;
      }
    });
    
    return correct;
  }
  
  private getDetailedResults() {
    if (!this.quizData) return [];
    
    return this.quizData.questions.map((question, index) => ({
      question: question.question,
      userAnswer: this.getUserAnswerText(question, index),
      correctAnswer: this.getCorrectAnswerText(question),
      isCorrect: this.isAnswerCorrect(index),
      explanation: question.explanation
    }));
  }

  calculateScore(): number {
    if (!this.quizData) return 0;

    let correctAnswers = 0;

    this.quizData.questions.forEach((question: Question, index: number) => {
      const userAnswer = this.selectedAnswers[index];
      if (userAnswer === null) return;

      if (question.multiple) {
        const userSelections = new Set(userAnswer as number[]);
        const allCorrectSelected = question.correctAnswers.every((ans: number) => userSelections.has(ans));
        const noIncorrectSelected = (userAnswer as number[]).every((ans: number) => question.correctAnswers.includes(ans));
        
        if (allCorrectSelected && noIncorrectSelected) {
          correctAnswers++;
        }
      } else {
        if (userAnswer === question.correctAnswers[0]) {
          correctAnswers++;
        }
      }
    });

    return Math.round((correctAnswers / this.quizData.questions.length) * 100);
  }

  restartQuiz(): void {
    this.currentQuestionIndex = 0;
    this.selectedAnswers = new Array(this.quizData?.questions.length || 0).fill(null);
    this.quizComplete = false;
    this.showResults = false;
    this.score = null;
    this.startTime = Date.now();
    this.timeSpent = 0;
    this.startTimer();
  }

  getMultiAnswerText(question: Question, index: number): string {
    const answers = this.selectedAnswers[index] as number[];
    return answers?.map(idx => question.options[idx]).join(', ') ?? '';
  }

  getSingleAnswerText(question: Question, index: number): string {
    const answer = this.selectedAnswers[index] as number;
    return question.options[answer] ?? '';
  }

  getMultiCorrectText(question: Question): string {
    return question.correctAnswers.map(idx => question.options[idx]).join(', ');
  }

  getSingleCorrectText(question: Question): string {
    return question.options[question.correctAnswers[0]] ?? '';
  }

  showDetailedResults(): void {
    this.showResults = true;
  }

  isAnswerCorrect(index: number): boolean {
    if (!this.quizData || !this.quizData.questions[index]) return false;
    
    const question = this.quizData.questions[index];
    const userAnswer = this.selectedAnswers[index];
    if (userAnswer === null) return false;

    if (question.multiple) {
      const userAnswers = userAnswer as number[];
      return (
        userAnswers.length === question.correctAnswers.length &&
        userAnswers.every(ans => question.correctAnswers.includes(ans))
      );
    } else {
      return userAnswer === question.correctAnswers[0];
    }
  }

  private shuffleQuestionsAndOptions(quizData: QuizData): QuizData {
    const shuffledQuestions = this.shuffleArray([...quizData.questions]);
    
    const questionsWithShuffledOptions = shuffledQuestions.map(question => {
      const optionsWithIndices = question.options.map((option, index) => ({
        option,
        originalIndex: index
      }));
      
      const shuffledOptionsWithIndices = this.shuffleArray([...optionsWithIndices]);
      
      const correctAnswers = shuffledOptionsWithIndices
        .map((item, newIndex) => ({
          originalIndex: item.originalIndex,
          newIndex
        }))
        .filter(item => question.correctAnswers.includes(item.originalIndex))
        .map(item => item.newIndex);
      
      return {
        ...question,
        options: shuffledOptionsWithIndices.map(item => item.option),
        correctAnswers
      };
    });
    
    return {
      ...quizData,
      questions: questionsWithShuffledOptions
    };
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  private getUserAnswerText(question: QuizQuestion, index: number): string {
    const answer = this.selectedAnswers[index];
    if (answer === null) return 'Не отвечено';
    
    if (question.multiple) {
      const selected = answer as number[];
      return selected.map(i => question.options[i]).join(', ') || 'Не отвечено';
    } else {
      return question.options[answer as number] || 'Не отвечено';
    }
  }
  private getCorrectAnswerText(question: QuizQuestion): string {
    if (question.multiple) {
      return question.correctAnswers.map(i => question.options[i]).join(', ');
    } else {
      return question.options[question.correctAnswers[0]];
    }
  }
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}