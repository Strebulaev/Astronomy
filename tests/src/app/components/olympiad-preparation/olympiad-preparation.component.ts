// components/olympiad-preparation/olympiad-preparation.component.ts
import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { OlympiadService } from '../../services/olympiad.service';
import { HistoryService } from '../../services/history.service';
import { QuizResult } from '../../models/quiz-result.model';
import { Olympiad } from '../../models/olympiad.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PdfViewerModule } from 'ng2-pdf-viewer'; /* @vite-ignore */  
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-olympiad-preparation',
  templateUrl: './olympiad-preparation.component.html',
  styleUrls: ['./olympiad-preparation.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, PdfViewerModule, MatIconModule]
})
export class OlympiadPreparationComponent implements OnInit {
  @ViewChild('pdfViewer') pdfViewer!: ElementRef;
  activeTab: 'upload' | 'list' = 'list';
  olympiads: Olympiad[] = [];
  selectedOlympiad: Olympiad | null = null;
  pdfFile: File | null = null;
  isPdfLoaded = false;
  pdfName = '';
  olympiadYear = new Date().getFullYear();
  olympiadStage = 'school';
  maxScore = 100;
  currentScore = 0;
  timer = 0;
  timerInterval: any;
  showResultModal = false;
  resultData: any = {};
  pdfScale = 0.8; 
  currentScale = 1.0;
  zoomStep = 0.1;
  minZoom = 0.5;
  maxZoom = 2.0;
  constructor(
    private olympiadService: OlympiadService,
    private historyService: HistoryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadOlympiads();
    this.calculateInitialZoom();
  }
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
      // Предполагаем стандартную ширину PDF в 800px
      this.currentScale = (containerWidth - 40) / 800;
    }
  }

  private calculateInitialZoom(): void {
    // Автоматический подбор масштаба при загрузке
    setTimeout(() => this.fitToWidth(), 100);
  }
  loadOlympiads(): void {
    this.olympiads = this.olympiadService.getOlympiads();
  }
  changeScale(newScale: number) {
    this.pdfScale = newScale;
  }
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.type === 'application/pdf') {
        this.pdfFile = file;
        this.pdfName = file.name.replace('.pdf', '');
      } else {
        alert('Пожалуйста, выберите PDF файл');
      }
    }
  }

  uploadOlympiad(): void {
    if (!this.pdfFile) return;
    const pdfUrl = URL.createObjectURL(this.pdfFile);

    let olympiadName = this.pdfName.trim();
    if (!olympiadName) {
      olympiadName = this.pdfFile.name.replace('.pdf', '');
    }
    this.olympiadService.addOlympiad({
      name: olympiadName,
      year: this.olympiadYear,
      stage: this.olympiadStage,
      pdfUrl: pdfUrl, 
      maxScore: this.maxScore
    });
  
    this.loadOlympiads();
    this.resetUploadForm();
  } 

  resetUploadForm(): void {
    this.pdfFile = null;
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
    this.isPdfLoaded = false; // Сбрасываем флаг загрузки
    this.startTimer();
    
    // Принудительно запускаем обнаружение изменений
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
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
    }
  }

  adjustScore(amount: number): void {
    this.currentScore = Math.max(0, Math.min(this.selectedOlympiad?.maxScore || 100, this.currentScore + amount));
  }

  finishOlympiad(): void {
    this.stopTimer();
    
    if (!this.selectedOlympiad) return;

    const result: QuizResult = {
      id: this.generateId(),
      testName: `${this.selectedOlympiad.name} (${this.selectedOlympiad.year})`,
      testType: 'olympiad', // Изменено с 'custom' на 'olympiad'
      date: new Date(),
      correctAnswers: this.currentScore,
      totalQuestions: this.selectedOlympiad.maxScore,
      maxScore: this.selectedOlympiad.maxScore,
      timeSpent: this.timer,
      pdfUrl: this.selectedOlympiad.pdfUrl
    };

    this.historyService.addResult(result);
    this.showResultModal = true;
    this.resultData = {
      score: this.currentScore,
      maxScore: this.selectedOlympiad.maxScore,
      timeSpent: this.formatTime(this.timer)
    };
}
  closeResultModal(): void {
    this.showResultModal = false;
    this.selectedOlympiad = null;
  }

  deleteOlympiad(id: string, event: Event): void {
    event.stopPropagation();
    if (confirm('Удалить эту олимпиаду?')) {
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

  onPdfLoadComplete(): void {
    this.isPdfLoaded = true;
    console.log('PDF successfully loaded');
  }
  
  onPdfLoadError(error: any): void {
    console.error('PDF load error:', error);
    this.isPdfLoaded = false;
  }
}