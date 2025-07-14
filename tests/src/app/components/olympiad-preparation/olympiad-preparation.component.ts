// olympiad-preparation.component.ts
import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { OlympiadService } from '../../services/olympiad.service';
import { HistoryService } from '../../services/history.service';
import { QuizResult } from '../../models/quiz-result.model';
import { Olympiad } from '../../models/olympiad.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-olympiad-preparation',
  templateUrl: './olympiad-preparation.component.html',
  styleUrls: ['./olympiad-preparation.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, PdfViewerModule, MatIconModule]
})
export class OlympiadPreparationComponent implements OnInit {
  @ViewChild('pdfViewer') pdfViewer!: ElementRef;
  
  // Состояние компонента
  activeTab: 'upload' | 'list' = 'list';
  olympiads: Olympiad[] = [];
  filteredOlympiads: Olympiad[] = [];
  selectedOlympiad: Olympiad | null = null;
  editedOlympiad: Olympiad | null = null;
  
  // Файлы
  pdfFile: File | null = null;
  solutionFile: File | null = null;
  
  // Флаги состояния
  isPdfLoaded = false;
  isEditing = false;
  showResultModal = false;
  showSolutionsModal = false;
  
  // Данные формы
  pdfName = '';
  olympiadYear = new Date().getFullYear();
  olympiadStage = 'school';
  maxScore = 100;
  
  // Таймер и результаты
  currentScore = 0;
  timer = 0;
  timerInterval: any;
  resultData: any = {};
  
  // Настройки PDF
  currentScale = 1.0;
  zoomStep = 0.1;
  minZoom = 0.5;
  maxZoom = 2.0;

  // Фильтры
  filterName = '';
  filterYear = '';
  filterStage = '';
  availableYears: number[] = [];

  constructor(
    private olympiadService: OlympiadService,
    private historyService: HistoryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadOlympiads();
    this.calculateInitialZoom();
    this.generateAvailableYears();
  }

  private generateAvailableYears(): void {
    const currentYear = new Date().getFullYear();
    this.availableYears = Array.from({length: 19}, (_, i) => currentYear - i);
  }

  loadOlympiads(): void {
    this.olympiads = this.olympiadService.getOlympiads();
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredOlympiads = this.olympiads.filter(olympiad => {
      const nameMatch = this.filterName 
        ? olympiad.name.toLowerCase().includes(this.filterName.toLowerCase())
        : true;
      
      const yearMatch = this.filterYear 
        ? olympiad.year.toString() === this.filterYear
        : true;
      
      const stageMatch = this.filterStage 
        ? olympiad.stage === this.filterStage
        : true;
      
      return nameMatch && yearMatch && stageMatch;
    });

    // Сортируем по году (новые сначала)
    this.filteredOlympiads.sort((a, b) => b.year - a.year);
  }

  resetFilters(): void {
    this.filterName = '';
    this.filterYear = '';
    this.filterStage = '';
    this.applyFilters();
  }

  startEditOlympiad(olympiad: Olympiad, event: Event): void {
    event.stopPropagation();
    this.editedOlympiad = {...olympiad};
    this.isEditing = true;
    
    this.pdfFile = null;
    this.solutionFile = null;
    this.removeSolution = false;
    
    // Сохраняем оригинальные URL
    this.currentPdfUrl = olympiad.pdfUrl;
    this.currentSolutionUrl = olympiad.solutionUrl; // может быть undefined
  }
  
  
  saveOlympiadChanges(): void {
    if (!this.editedOlympiad) return;
    
    // Обработка PDF файла (всегда должен быть)
    this.editedOlympiad.pdfUrl = this.pdfFile 
      ? URL.createObjectURL(this.pdfFile)
      : this.currentPdfUrl;
  
    // Обработка файла решений
    if (this.solutionFile) {
      this.editedOlympiad.solutionUrl = URL.createObjectURL(this.solutionFile);
    } else if (this.removeSolution) {
      this.editedOlympiad.solutionUrl = undefined; // явное удаление
    } else {
      this.editedOlympiad.solutionUrl = this.currentSolutionUrl; // сохраняем текущее
    }
  
    this.olympiadService.updateOlympiad(this.editedOlympiad);
    this.loadOlympiads();
    this.cancelEdit();
  }
  
  cancelEdit(): void {
    this.isEditing = false;
    this.editedOlympiad = null;
    this.pdfFile = null;
    this.solutionFile = null;
    this.removeSolution = false;
    this.currentPdfUrl = '';
    this.currentSolutionUrl = undefined;
  }
  
  // Добавьте эти свойства в класс компонента:
  currentPdfUrl: string = ''; // всегда строка
  currentSolutionUrl: string | undefined;
  removeSolution = false;


  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.type === 'application/pdf') {
        this.pdfFile = file;
        
        // Автозаполнение названия если поле пустое
        if (!this.pdfName && !this.isEditing) {
          this.pdfName = file.name.replace('.pdf', '');
        }
      } else {
        alert('Пожалуйста, выберите PDF файл');
      }
    }
  }

  onSolutionFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.type === 'application/pdf') {
        this.solutionFile = file;
      } else {
        alert('Пожалуйста, выберите PDF файл');
      }
    }
  }

  uploadOlympiad(): void {
    if (!this.pdfFile) {
      alert('Пожалуйста, выберите PDF файл');
      return;
    }

    const pdfUrl = URL.createObjectURL(this.pdfFile);
    let solutionUrl: string | undefined;

    if (this.solutionFile) {
      solutionUrl = URL.createObjectURL(this.solutionFile);
    }

    const olympiadName = this.pdfName.trim() || this.pdfFile.name.replace('.pdf', '');

    this.olympiadService.addOlympiad({
      name: olympiadName,
      year: this.olympiadYear,
      stage: this.olympiadStage,
      pdfUrl: pdfUrl,
      solutionUrl: solutionUrl,
      maxScore: this.maxScore
    });

    this.loadOlympiads();
    this.resetUploadForm();
  }

  resetUploadForm(): void {
    this.pdfFile = null;
    this.solutionFile = null;
    this.pdfName = '';
    this.olympiadYear = new Date().getFullYear();
    this.olympiadStage = 'school';
    this.maxScore = 100;
  }

  getStageName(stage: string): string {
    switch (stage) {
      case 'school': return 'Школьный этап';
      case 'municipal': return 'Муниципальный этап';
      case 'regional': return 'Региональный этап';
      case 'final': return 'Заключительный этап';
      default: return stage;
    }
  }

  openOlympiad(olympiad: Olympiad): void {
    this.selectedOlympiad = olympiad;
    this.currentScore = 0;
    this.timer = 0;
    this.isPdfLoaded = false;
    this.startTimer();
    this.cdr.detectChanges();
  }

  startTimer(): void {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      this.timer++;
    }, 1000);
  }

  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  adjustScore(amount: number): void {
    if (!this.selectedOlympiad) return;
    
    this.currentScore = Math.max(0, 
      Math.min(this.selectedOlympiad.maxScore, this.currentScore + amount));
  }

  finishOlympiad(): void {
    this.stopTimer();
    
    if (!this.selectedOlympiad) return;

    const result: QuizResult = {
      id: this.generateId(),
      testName: `${this.selectedOlympiad.name} (${this.selectedOlympiad.year})`,
      testType: 'olympiad',
      date: new Date(),
      correctAnswers: this.currentScore,
      totalQuestions: this.selectedOlympiad.maxScore,
      maxScore: this.selectedOlympiad.maxScore,
      timeSpent: this.timer,
      pdfUrl: this.selectedOlympiad.pdfUrl,
      solutionUrl: this.selectedOlympiad.solutionUrl, // Теперь это допустимо
      hasSolution: !!this.selectedOlympiad.solutionUrl
    };

    this.historyService.addResult(result);
    this.showResultModal = true;
    this.resultData = {
      score: this.currentScore,
      maxScore: this.selectedOlympiad.maxScore,
      timeSpent: this.formatTime(this.timer),
      hasSolution: !!this.selectedOlympiad.solutionUrl
    };
}
  viewSolutions(): void {
    this.showResultModal = false;
    this.showSolutionsModal = true;
  }

  closeResultModal(): void {
    this.showResultModal = false;
    this.selectedOlympiad = null;
  }

  closeSolutionsModal(): void {
    this.showSolutionsModal = false;
  }

  deleteOlympiad(id: string, event: Event): void {
    event.stopPropagation();
    
    if (confirm('Вы уверены, что хотите удалить эту олимпиаду?')) {
      this.olympiadService.removeOlympiad(id);
      this.loadOlympiads();
    }
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  // PDF Viewer controls
  zoomIn(): void {
    this.currentScale = Math.min(this.currentScale + this.zoomStep, this.maxZoom);
  }

  zoomOut(): void {
    this.currentScale = Math.max(this.currentScale - this.zoomStep, this.minZoom);
  }

  resetZoom(): void {
    this.currentScale = 1.0;
  }

  fitToWidth(): void {
    const container = document.querySelector('.pdf-viewer-wrapper');
    if (container) {
      const containerWidth = container.clientWidth;
      this.currentScale = (containerWidth - 40) / 800; // 800 - предполагаемая ширина PDF
    }
  }

  private calculateInitialZoom(): void {
    setTimeout(() => this.fitToWidth(), 100);
  }

  onPdfLoadComplete(): void {
    this.isPdfLoaded = true;
  }
  
  onPdfLoadError(error: any): void {
    console.error('PDF load error:', error);
    this.isPdfLoaded = false;
    alert('Ошибка загрузки PDF файла');
  }
}