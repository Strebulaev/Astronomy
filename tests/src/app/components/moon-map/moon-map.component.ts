import { Component, OnInit } from '@angular/core';

interface MoonLocation {
  id: string;
  name: string;
  x: number;
  y: number;
  type: string;
  learned: boolean;
}

@Component({
  selector: 'app-moon-map',
  templateUrl: './moon-map.component.html',
  styleUrls: ['./moon-map.component.scss']
})
export class MoonMapComponent implements OnInit {
  locations: MoonLocation[] = [
    { id: 'oceanus_procellarum', name: 'Океан Бурь', x: 25, y: 40, type: 'oceanus', learned: false },
    { id: 'mare_imbrium', name: 'Море Дождей', x: 40, y: 30, type: 'mare', learned: false },
    { id: 'mare_tranquillitatis', name: 'Море Спокойствия', x: 55, y: 45, type: 'mare', learned: false },
    { id: 'mare_serenitatis', name: 'Море Ясности', x: 50, y: 35, type: 'mare', learned: false },
    { id: 'mare_nubium', name: 'Море Облаков', x: 35, y: 55, type: 'mare', learned: false },
    { id: 'mare_frigoris', name: 'Море Холода', x: 45, y: 20, type: 'mare', learned: false },
    { id: 'mare_crisium', name: 'Море Кризисов', x: 75, y: 35, type: 'mare', learned: false },
    { id: 'tycho', name: 'Кратер Тихо', x: 40, y: 70, type: 'crater', learned: false },
    { id: 'copernicus', name: 'Кратер Коперник', x: 30, y: 45, type: 'crater', learned: false },
    { id: 'kepler', name: 'Кратер Кеплер', x: 25, y: 50, type: 'crater', learned: false },
    { id: 'aristarchus', name: 'Кратер Аристарх', x: 20, y: 35, type: 'crater', learned: false },
    { id: 'plato', name: 'Кратер Платон', x: 35, y: 25, type: 'crater', learned: false }
  ];

  // Режимы
  quizMode: boolean = false;
  studyMode: boolean = false;
  showResults: boolean = false;

  // Викторина
  currentQuizLocation: MoonLocation | null = null;
  selectedLocation: MoonLocation | null = null;
  showCorrect: boolean = false;
  showWrong: boolean = false;
  currentQuestionIndex: number = 0;
  correctAnswers: number = 0;
  quizLocations: MoonLocation[] = [];

  get learnedCount(): number {
    return this.locations.filter(loc => loc.learned).length;
  }

  ngOnInit() {
    this.loadProgress();
  }

  // Стартовый экран
  startQuiz() {
    this.quizMode = true;
    this.studyMode = false;
    this.showResults = false;
    this.correctAnswers = 0;
    this.currentQuestionIndex = 0;
    
    // Берем только изученные локации или все, если ни одна не изучена
    const availableLocations = this.learnedCount > 0 
      ? this.locations.filter(loc => loc.learned)
      : this.locations;
    
    this.quizLocations = [...availableLocations].sort(() => Math.random() - 0.5);
    
    this.nextQuestion();
  }

  showStudyMode() {
    this.studyMode = true;
    this.quizMode = false;
    this.showResults = false;
  }

  exitStudyMode() {
    this.studyMode = false;
  }

  // Викторина
  checkAnswer(selectedLocation: MoonLocation) {
    if (!this.quizMode || !this.currentQuizLocation || this.showCorrect) {
      return;
    }

    this.selectedLocation = selectedLocation;

    if (selectedLocation.id === this.currentQuizLocation.id) {
      this.showCorrect = true;
      this.correctAnswers++;
      
      setTimeout(() => {
        this.nextQuestion();
      }, 1500);
    } else {
      this.showWrong = true;
      setTimeout(() => {
        this.showWrong = false;
        this.showCorrect = true;
        setTimeout(() => {
          this.nextQuestion();
        }, 1500);
      }, 1000);
    }
  }

  nextQuestion() {
    this.showCorrect = false;
    this.showWrong = false;
    this.selectedLocation = null;

    if (this.currentQuestionIndex < this.quizLocations.length) {
      this.currentQuizLocation = this.quizLocations[this.currentQuestionIndex];
      this.currentQuestionIndex++;
    } else {
      this.showResults = true;
      this.quizMode = false;
    }
  }

  exitQuiz() {
    this.quizMode = false;
    this.showResults = false;
    this.currentQuizLocation = null;
  }

  // Результаты
  restartQuiz() {
    this.startQuiz();
  }

  returnToStart() {
    this.quizMode = false;
    this.studyMode = false;
    this.showResults = false;
  }

  getPercentage(): number {
    return Math.round((this.correctAnswers / this.quizLocations.length) * 100);
  }

  getResultsMessage(): string {
    const percentage = this.getPercentage();
    if (percentage >= 90) return 'Отличный результат! Вы настоящий эксперт по Луне! 🌕';
    if (percentage >= 70) return 'Хороший результат! Вы хорошо знаете лунную географию! 🌖';
    if (percentage >= 50) return 'Неплохой результат! Продолжайте изучать Луну! 🌗';
    return 'Попробуйте ещё раз! Изучите объекты в режиме обучения! 🌘';
  }

  // Режим изучения
  toggleLearnLocation(location: MoonLocation) {
    location.learned = !location.learned;
    this.saveProgress();
  }

  resetProgress() {
    this.locations.forEach(location => location.learned = false);
    this.saveProgress();
  }

  // Вспомогательные методы
  onImageLoad() {
    console.log('Moon map image loaded successfully');
  }

  onImageError() {
    console.log('Moon map image failed to load, using fallback');
    this.createFallbackMoon();
  }

  private createFallbackMoon() {
    const container = document.querySelector('.moon-image-container') as HTMLElement;
    if (container) {
      const canvas = document.createElement('canvas');
      canvas.className = 'moon-image fallback';
      canvas.width = 800;
      canvas.height = 800;
      
      const ctx = canvas.getContext('2d')!;
      
      const gradient = ctx.createRadialGradient(400, 400, 0, 400, 400, 400);
      gradient.addColorStop(0, '#888888');
      gradient.addColorStop(1, '#333333');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(400, 400, 400, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#555555';
      ctx.beginPath();
      ctx.ellipse(300, 300, 80, 60, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.ellipse(500, 350, 70, 50, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.ellipse(400, 500, 60, 40, 0, 0, Math.PI * 2);
      ctx.fill();
      
      container.appendChild(canvas);
    }
  }

  private saveProgress() {
    localStorage.setItem('moonLocationsProgress', JSON.stringify(this.locations));
  }

  private loadProgress() {
    const saved = localStorage.getItem('moonLocationsProgress');
    if (saved) {
      const savedLocations = JSON.parse(saved);
      this.locations.forEach(location => {
        const savedLocation = savedLocations.find((sl: any) => sl.id === location.id);
        if (savedLocation) {
          location.learned = savedLocation.learned;
        }
      });
    }
  }
}