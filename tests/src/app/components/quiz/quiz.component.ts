import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

interface Question {
  question: string;
  options: string[];
  correctAnswers: number[];
  multiple: boolean;
}

interface QuizData {
  name: string;
  questions: Question[];
}

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, RouterLink],
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

  constructor(
    private route: ActivatedRoute,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.loadQuizData();
  }

  private loadQuizData(): void {
    this.quizData = history.state?.quizData;
    
    if (!this.quizData) {
      console.error('No quiz data provided');
      this.router.navigate(['/']);
      return;
    }

    this.selectedAnswers = new Array(this.quizData.questions.length).fill(null);
  }

  get currentQuestion(): Question | null {
    return this.quizData?.questions[this.currentQuestionIndex] ?? null;
  }

  get progress(): number {
    return this.quizData ? ((this.currentQuestionIndex + 1) / this.quizData.questions.length) * 100 : 0;
  }

  selectAnswer(index: number): void {
    if (!this.currentQuestion) return;

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
    } else {
      this.completeQuiz();
    }
  }

  prevQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  completeQuiz(): void {
    this.quizComplete = true;
    this.score = this.calculateScore();
  }

  private calculateScore(): number {
    if (!this.quizData) return 0;

    let correctAnswers = 0;

    this.quizData.questions.forEach((question, index) => {
      const userAnswer = this.selectedAnswers[index];
      if (userAnswer === null) return;

      if (question.multiple) {
        const userSelections = new Set(userAnswer as number[]);
        const allCorrectSelected = question.correctAnswers.every(ans => userSelections.has(ans));
        const noIncorrectSelected = (userAnswer as number[]).every(ans => question.correctAnswers.includes(ans));
        
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
}