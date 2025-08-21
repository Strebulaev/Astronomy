import { AfterViewInit, Component, ElementRef, OnInit, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { Question } from '../../models/question.model';
import { TagCategory } from '../../models/tag.model';
import { QuizDataService } from '../../services/quiz-data.service';
import { QuizData } from '../../models/quiz-data.model';
import { Test } from '../../models/test.model';
import * as yaml from 'js-yaml';

@Component({
  selector: 'app-test-creator',
  templateUrl: './test-creator.component.html',
  styleUrls: ['./test-creator.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class TestCreatorComponent implements OnInit, AfterViewInit {
  @ViewChildren('difficultySlider') sliders!: QueryList<ElementRef>;
  allQuestions: Question[] = [];
  filteredQuestions: Question[] = [];
  tags: TagCategory[] = [];
  selectedTags: string[] = [];
  difficultyRange: [number, number] = [0, 100];
  questionCount = 10;
  selectedQuestions: Question[] = [];
  autoGenerate = true;
  loading = false;
  tagSearchQuery = '';
  filteredTags: TagCategory[] = [];
  constructor(  
    private dataService: DataService,
    private router: Router,
    private quizDataService: QuizDataService
  ) {this.selectedTags = [];}
  maxQuestionsAvailable = false;
  ngOnInit(): void {
    this.loadQuestions();
    this.loadTags();
  }
  ngAfterViewInit() {
    this.fixSliderDirection();
  }
  toggleMaxQuestions(): void {
    this.maxQuestionsAvailable = !this.maxQuestionsAvailable;
    if (this.maxQuestionsAvailable) {
      this.questionCount = this.filteredQuestions.length;
    }
  }
  
  private fixSliderDirection() {
    setTimeout(() => {
      this.sliders.forEach(slider => {
        slider.nativeElement.style.direction = 'rtl';
      });
    });
  }
  loadQuestions(): void {
    this.dataService.getQuestions().subscribe((questions: Question[]) => {
      this.allQuestions = questions;
      this.filteredQuestions = [...questions];
    });
  }

  private getRandomQuestions(questions: Question[], count: number): Question[] {
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  loadTags(): void {
    this.dataService.getTags().subscribe((tags: TagCategory[]) => {
      this.tags = tags;
      this.filteredTags = [...tags]; // Initialize filteredTags with all tags
      this.selectedTags = [];
    });
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags.includes(tag);
  }

  toggleTagSelection(tag: string): void {
    const index = this.selectedTags.indexOf(tag);
    if (index > -1) {
      this.selectedTags.splice(index, 1);
    } else {
      this.selectedTags.push(tag);
    }
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredQuestions = this.allQuestions.filter(question => {
      const matchesTags = this.selectedTags.length === 0 || 
        this.selectedTags.some(tag => question.tags.includes(tag));
      
      const matchesDifficulty = question.difficulty >= this.difficultyRange[0] && 
        question.difficulty <= this.difficultyRange[1];
      
      return matchesTags && matchesDifficulty;
    });
    
    if (this.maxQuestionsAvailable) {
      this.questionCount = this.filteredQuestions.length;
    }
  }
  resetFilters(): void {
    this.selectedTags = [];
    this.difficultyRange = [0, 100];
    this.questionCount = 10;
    this.applyFilters();
  }

  toggleQuestionSelection(question: Question): void {
    const index = this.selectedQuestions.findIndex(q => q.id === question.id);
    if (index > -1) {
      this.selectedQuestions.splice(index, 1);
    } else {
      this.selectedQuestions.push(question);
    }
  }

  isSelected(question: Question): boolean {
    return this.selectedQuestions.some(q => q.id === question.id);
  }

  saveAsCustomThematicTest(startTestImmediately = true): void {
    if (this.loading) return;
  
    const availableQuestions = [...this.filteredQuestions];
    if (availableQuestions.length === 0) return;
  
    const questionsToUse = this.autoGenerate
      ? this.getRandomQuestions(availableQuestions, this.questionCount)
      : availableQuestions;
  
    const testName = this.selectedTags.length > 0 
      ? `${this.selectedTags.join(', ')}` 
      : 'Кастомный тематический тест';
  
    // Вычисляем среднюю сложность
    const sumDifficulty = questionsToUse.reduce((sum, q) => sum + q.difficulty, 0);
    const avgDifficulty = Math.round(sumDifficulty / questionsToUse.length);
  
    const test: Test = {
      id: this.generateUniqueId(),
      name: testName,
      tags: [...this.selectedTags],
      isCustom: false,
      isCustomThematic: true,
      questionCount: questionsToUse.length,
      averageDifficulty: avgDifficulty,
      questions: questionsToUse.map(q => ({
        question: q.text,
        difficulty: q.difficulty, // Сохраняем сложность вопроса
        options: q.options.map(o => ({
          text: o.text,
          correct: o.correct
        })),
        explanation: q.explanation
      }))
    };
  
    this.dataService.saveCustomTest(test);
    
    if (startTestImmediately) {
      this.startTest(test);
    } else {
      alert(`Тест "${testName}" успешно сохранен!`);
    }
  }
  
  private generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  public startTest(testData?: Test): void {
    if (this.loading) return;

    const availableQuestions = [...this.filteredQuestions];
    if (availableQuestions.length === 0) return;

    const questionsToUse = this.autoGenerate
      ? this.getRandomQuestions(availableQuestions, this.questionCount)
      : availableQuestions;

    const test: Test = {
      name: 'Сгенерированный тест',
      tags: [...this.selectedTags],
      isCustom: true,
      questions: questionsToUse.map(q => ({
        question: q.text,
        options: q.options.map(o => ({
          text: o.text,
          correct: o.correct
        })),
        explanation: q.explanation
      }))
    };

    this.prepareAndStartTest(testData || test);
  }
  private prepareAndStartTest(testData: Test): void {
    const quizData: QuizData = {
      name: testData.name,
      testType: testData.isCustom ? 'custom' : 'thematic',
      questions: testData.questions.map(q => {
        const shuffledOptions = this.shuffleArray([...q.options]);
        
        return {
          question: q.question,
          options: shuffledOptions.map(o => o.text),
          correctAnswers: shuffledOptions
            .map((o, i) => o.correct ? i : -1)
            .filter(i => i !== -1),
          multiple: shuffledOptions.filter(o => o.correct).length > 1,
          explanation: q.explanation
        };
      })
    };

    this.quizDataService.setQuizData(quizData);
    this.router.navigate(['/quiz']);
  }
  private shuffleArray(array: any[]): any[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  filterTags(): void {
    if (!this.tagSearchQuery) {
      this.filteredTags = [...this.tags];
      return;
    }

    const searchQuery = this.tagSearchQuery.toLowerCase();
    this.filteredTags = this.tags.map(category => {
      const filteredTags = category.tags.filter(tag => 
        tag.toLowerCase().includes(searchQuery)
      );
      return { ...category, tags: filteredTags };
    }).filter(category => category.tags.length > 0);
  }
  async loadData(): Promise<void> {
    this.loading = true;
    try {
      const [questions, tags] = await Promise.all([
        this.dataService.getQuestions().toPromise(),
        this.dataService.getTags().toPromise()
      ]);
      this.allQuestions = questions || [];
      this.tags = tags || [];
      this.applyFilters();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      this.loading = false;
    }
  }

  toggleTag(tag: string): void {
    const index = this.selectedTags.indexOf(tag);
    if (index > -1) {
      this.selectedTags.splice(index, 1);
    } else {
      this.selectedTags.push(tag);
    }
    this.applyFilters();
  }

  async onFileUpload(event: any): Promise<void> {
    const file = event.target.files[0];
    if (!file) return;
  
    try {
      const content = await this.readFileAsText(file);
      
      // Полностью обходим стандартный YAML парсер - используем свой
      const questions = this.parseQuestionsFromContent(content);
      
      if (questions.length > 0) {
        // Создаем тест напрямую, без вызова loadQuestions()
        this.createTestDirectly(questions, file.name);
      } else {
        alert('Не найдено вопросов в файле.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Ошибка при чтении файла.');
    }
    
    event.target.value = '';
  }
  
  private parseQuestionsFromContent(content: string): any[] {
    const questions: any[] = [];
    
    // Разбиваем на блоки вопросов
    const questionBlocks = content.split(/\n(?=- id:)/).filter(block => block.trim());
    
    for (const block of questionBlocks) {
      try {
        const question: any = {};
        
        // ID
        const idMatch = block.match(/id:\s*([^\n]+)/);
        if (idMatch) question.id = idMatch[1].trim();
        
        // Tags
        const tagsMatch = block.match(/tags:\s*([\s\S]*?)(?=\n\w+:|$)/);
        if (tagsMatch) {
          const tagsText = tagsMatch[1];
          const tagMatches = tagsText.matchAll(/-\s*([^\n]+)/g);
          question.tags = Array.from(tagMatches).map(m => m[1].trim());
        }
        
        // Text
        const textMatch = block.match(/text:\s*"([^"]+)"|text:\s*([^\n]+)/);
        if (textMatch) {
          question.text = (textMatch[1] || textMatch[2]).trim();
        }
        
        // Difficulty
        const diffMatch = block.match(/difficulty:\s*(\d+)/);
        if (diffMatch) question.difficulty = parseInt(diffMatch[1]);
        
        // Options
        const optionsMatch = block.match(/options:\s*([\s\S]*?)(?=\n\w+:|$)/);
        if (optionsMatch) {
          const optionsText = optionsMatch[1];
          const optionMatches = optionsText.matchAll(/-\s*text:\s*"([^"]+)"\s*\n\s*correct:\s*(true|false)/g);
          question.options = Array.from(optionMatches).map(m => ({
            text: m[1].trim(),
            correct: m[2] === 'true'
          }));
        }
        
        // Explanation
        const expMatch = block.match(/explanation:\s*"([^"]+)"|explanation:\s*([^\n]+)/);
        if (expMatch) {
          question.explanation = (expMatch[1] || expMatch[2]).trim();
        }
        
        // Проверяем минимальные требования
        if (question.text && question.options && question.options.length >= 2) {
          questions.push(question);
        }
        
      } catch (e) {
        console.warn('Error parsing question block:', e);
      }
    }
    
    return questions;
  }
  
  private createTestDirectly(questions: any[], fileName: string): void {
    const testName = fileName.replace('.yml', '').replace('.yaml', '');
    const allTags = [...new Set(questions.flatMap(q => q.tags || []))];
    
    const test: Test = {
      id: this.generateTestId(),
      name: testName,
      tags: allTags,
      questions: questions.map(q => ({
        question: q.text,
        options: (q.options || []).map((opt: any) => ({
          text: opt.text,
          correct: opt.correct === true || opt.correct === 'true'
        })),
        explanation: q.explanation,
        difficulty: q.difficulty || 50
      })),
      isCustom: true,
      isCustomThematic: true,
      questionCount: questions.length,
      averageDifficulty: Math.round(questions.reduce((sum, q) => sum + (q.difficulty || 50), 0) / questions.length)
    };
  
    this.saveTestDirectly(test);
    alert(`Тест "${testName}" успешно загружен! Содержит ${questions.length} вопросов.`);
    
    this.updateUIAfterUpload();
  }
  
  private saveTestDirectly(test: Test): void {
    const customTests = this.getCustomTests();
    customTests.push(test);
    localStorage.setItem('custom_tests', JSON.stringify(customTests));
  }
  
  private getCustomTests(): Test[] {
    const testsJson = localStorage.getItem('custom_tests');
    return testsJson ? JSON.parse(testsJson) : [];
  }
  
  private updateUIAfterUpload(): void {
    this.loading = false;
  }
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }
  
  private generateTestId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

}