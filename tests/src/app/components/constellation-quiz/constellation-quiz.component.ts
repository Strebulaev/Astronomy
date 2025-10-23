import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Constellation, ConstellationTest, GameMode } from '../../models/constellation.model';
import { ConstellationService } from '../../services/constellation.service';
import { HistoryService } from '../../services/history.service';
import { QuizResult } from '../../models/quiz-result.model';
import { SubjectManagerService } from '../../services/subject-manager.service';
import { Subject } from '../../models/subject.model';
import { TimePipe } from '../../shared/time.pipe';

@Component({
  selector: 'app-constellation-quiz',
  templateUrl: './constellation-quiz.component.html',
  styleUrls: ['./constellation-quiz.component.css'],
  standalone: true,
  imports: [CommonModule, TimePipe]
})
export class ConstellationQuizComponent implements OnInit, OnDestroy {
  constellationTest: ConstellationTest | null = null;
  currentQuestionIndex = 0;
  selectedAnswer: string | null = null;
  showResult = false;
  score = 0;
  quizComplete = false;
  timeSpent = 0;
  private timerInterval: any;
  private startTime!: number;
  loading = true;
  error: string | null = null;

  // Кэш для вариантов ответов каждого вопроса
  private questionOptionsCache: string[][] = [];
  private questionImagesCache: string[][] = [];
  public currentImageIndex: number[] = [];

  private subscriptions: Subscription[] = [];
  currentSubject: Subject | null = null;
  gameMode: GameMode | null = null;

  constructor(
    private constellationService: ConstellationService,
    private historyService: HistoryService,
    public router: Router,
    public route: ActivatedRoute,
    private subjectManager: SubjectManagerService
  ) {}

  ngOnInit(): void {
    // Получаем выбранный режим из query parameters
    this.route.queryParams.subscribe(params => {
      const modeId = params['mode'];
      if (modeId) {
        this.gameMode = this.constellationService.getGameModes().find(mode => mode.id === modeId) || null;
        
        if (this.gameMode) {
          this.subjectManager.getCurrentSubject().subscribe(subject => {
            this.currentSubject = subject;
            this.startQuiz();
          });
        } else {
          this.error = 'Режим игры не найден';
          this.loading = false;
        }
      } else {
        this.error = 'Режим игры не выбран';
        this.loading = false;
      }
    });
  }

  startQuiz(): void {
    this.loading = true;
    this.error = null;

    if (!this.gameMode) {
      this.error = 'Режим игры не выбран';
      this.loading = false;
      return;
    }

    console.log('Starting quiz with mode:', this.gameMode);

    const sub = this.constellationService.createConstellationTest(this.gameMode).subscribe({

      next: (test) => {
        console.log('Successfully loaded constellation test:', test);
        this.constellationTest = test;
        this.precomputeQuestionData();
        this.startTimer();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading constellation test:', err);
        this.error = 'Не удалось загрузить тест созвездий: ' + err.message;
        this.loading = false;
      }
    });

    this.subscriptions.push(sub);
  }

  private precomputeQuestionData(): void {
    if (!this.constellationTest) return;

    this.questionOptionsCache = [];
    this.questionImagesCache = [];
    this.currentImageIndex = [];

    this.constellationTest.constellations.forEach((constellation, index) => {
      if (this.constellationTest?.mode === 'name') {
        this.precomputeNameModeOptions(constellation, index);
      } else {
        this.precomputeImageModeOptions(constellation, index);
      }
      
      this.currentImageIndex[index] = 0;
    });

    console.log('Precomputed question data:', {
      options: this.questionOptionsCache,
      images: this.questionImagesCache
    });
  }

  private precomputeNameModeOptions(constellation: Constellation, questionIndex: number): void {
    const currentName = constellation.name;
    
    const otherConstellations = this.constellationTest!.constellations
      .filter(c => c.name !== currentName)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(c => c.name);

    const allOptions = [currentName, ...otherConstellations].sort(() => Math.random() - 0.5);
    this.questionOptionsCache[questionIndex] = allOptions;
  }

  private precomputeImageModeOptions(constellation: Constellation, questionIndex: number): void {
    const currentImages = constellation.images;
    
    const otherConstellations = this.constellationTest!.constellations
      .filter(c => c.name !== constellation.name)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const allImages = [currentImages[0]];
    
    otherConstellations.forEach(c => {
      if (c.images.length > 0) {
        allImages.push(c.images[0]);
      }
    });

    const shuffledImages = [...allImages].sort(() => Math.random() - 0.5);
    this.questionImagesCache[questionIndex] = shuffledImages;
  }

  get currentConstellation(): Constellation | null {
    return this.constellationTest?.constellations[this.currentQuestionIndex] || null;
  }

  get options(): string[] {
    if (!this.constellationTest || this.questionOptionsCache.length === 0) return [];
    return this.questionOptionsCache[this.currentQuestionIndex] || [];
  }

  get imageOptions(): string[] {
    if (!this.constellationTest || this.questionImagesCache.length === 0) return [];
    return this.questionImagesCache[this.currentQuestionIndex] || [];
  }

  get currentImage(): string {
    if (!this.currentConstellation || this.currentConstellation.images.length === 0) return '';
    const currentIndex = this.currentImageIndex[this.currentQuestionIndex] || 0;
    return this.currentConstellation.images[currentIndex];
  }

  nextImage(): void {
    if (!this.currentConstellation) return;
    const currentIndex = this.currentImageIndex[this.currentQuestionIndex] || 0;
    const nextIndex = (currentIndex + 1) % this.currentConstellation.images.length;
    this.currentImageIndex[this.currentQuestionIndex] = nextIndex;
  }

  selectAnswer(answer: string): void {
    if (this.showResult) return;
    this.selectedAnswer = answer;
  }

  selectImageAnswer(imageUrl: string): void {
    if (this.showResult) return;
    this.selectedAnswer = imageUrl;
  }

  checkAnswer(): void {
    if (!this.selectedAnswer || !this.currentConstellation) return;

    this.showResult = true;

    let isCorrect = false;
    
    if (this.constellationTest?.mode === 'name') {
      isCorrect = this.selectedAnswer === this.currentConstellation.name;
    } else {
      isCorrect = this.selectedAnswer === this.currentConstellation.images[0];
    }

    if (isCorrect) {
      this.score++;
    }
  }

  nextQuestion(): void {
    this.showResult = false;
    this.selectedAnswer = null;

    if (this.currentQuestionIndex < (this.constellationTest?.constellations.length || 0) - 1) {
      this.currentQuestionIndex++;
    } else {
      this.completeQuiz();
    }
  }

  completeQuiz(): void {
    this.stopTimer();
    this.quizComplete = true;

    if (!this.constellationTest || !this.currentSubject) return;

    const result: QuizResult = {
      id: this.generateId(),
      subjectId: this.currentSubject.id,
      subjectName: this.currentSubject.name,
      testName: `Созвездия: ${this.constellationTest.name}`,
      testType: 'custom',
      date: new Date(),
      correctAnswers: this.score,
      totalQuestions: this.constellationTest.constellations.length,
      timeSpent: this.timeSpent
    };

    this.historyService.addResult(result);
  }

  restartQuiz(): void {
    this.currentQuestionIndex = 0;
    this.selectedAnswer = null;
    this.showResult = false;
    this.score = 0;
    this.quizComplete = false;
    this.timeSpent = 0;
    this.questionOptionsCache = [];
    this.questionImagesCache = [];
    this.currentImageIndex = [];
    this.startQuiz();
  }

  backToModes(): void {
    this.router.navigate(['/constellation-modes']);
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    console.warn('Failed to load constellation image:', imgElement.src);
    
    imgElement.alt = 'Изображение созвездия не найдено';
    imgElement.style.display = 'none';
    
    const container = imgElement.parentElement;
    if (container) {
      const errorMsg = document.createElement('div');
      errorMsg.className = 'image-error';
      errorMsg.innerHTML = '🌌<br>Изображение не найдено';
      errorMsg.style.cssText = `
        text-align: center;
        padding: 40px;
        color: #666;
        font-size: 1.2rem;
      `;
      container.appendChild(errorMsg);
    }
  }

  isNameMode(): boolean {
    return this.constellationTest?.mode === 'name';
  }

  isImageMode(): boolean {
    return this.constellationTest?.mode === 'image';
  }

  isAnswerCorrect(): boolean {
    if (!this.selectedAnswer || !this.currentConstellation) return false;
    
    if (this.isNameMode()) {
      return this.selectedAnswer === this.currentConstellation.name;
    } else {
      return this.selectedAnswer === this.currentConstellation.images[0];
    }
  }

  getCorrectAnswer(): string {
    if (!this.currentConstellation) return '';
    
    if (this.isNameMode()) {
      return this.currentConstellation.name;
    } else {
      return 'Правильное изображение';
    }
  }

  private startTimer(): void {
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      this.timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  get progress(): number {
    if (!this.constellationTest) return 0;
    return ((this.currentQuestionIndex + 1) / this.constellationTest.constellations.length) * 100;
  }

  get totalQuestions(): number {
    return this.constellationTest?.constellations.length || 0;
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}