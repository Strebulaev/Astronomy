import { Component, EventEmitter, HostListener, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import * as yaml from 'js-yaml';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject as RxjsSubject, take, takeUntil } from 'rxjs';
import { ProgressChartsComponent } from "../progress-charts/progress-charts.component";
import { ProgressDataService } from '../../services/progress-data.service';
import { QuillModule } from 'ngx-quill';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SubjectManagerService } from '../../services/subject-manager.service';
import { PlanManagerService, Plan } from '../../services/plan-manager.service';
import { Router } from '@angular/router';
import { Subject } from '../../models/subject.model';

interface Topic {
  id: string;
  title: string;
  difficulty: number;
  time: string;
  notesHtml?: SafeHtml;
  completed: boolean;
  completedDate: Date | null;
  notes: string;
  dueDate: Date;
  week: number;
  day: number;
  subtopics?: string[];
  terms?: TermDefinition[];
}

interface TermDefinition {
  term: string;
  definition: string;
}

export interface ProgressForecast {
  expectedEndDate: Date;
  basedOn: 'topics' | 'hours';
  currentRate: number;
  optimisticDate: Date;
  pessimisticDate: Date;
  totalHours?: number;
  completedHours?: number;
  remainingHours?: number;
}

@Component({
  selector: 'app-daily-topics',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, ProgressChartsComponent, QuillModule],
  templateUrl: './daily-topics.component.html',
  styleUrls: ['./daily-topics.component.css']
})
export class DailyTopicsComponent implements OnInit {
  currentPlan: Plan | null = null;
  viewMode: 'today' | 'diary' | 'future' | 'charts' = 'today';
  selectedTopic: Topic | null = null
  searchQuery: string = '';
  currentDate: Date = new Date();
  filter: 'all' | 'completed' | 'pending' = 'all';
  isEditingTerm = false;
  currentTerm: TermDefinition | null = null;
  forecast?: ProgressForecast;
  autoSaved = false;
  termSearch: string = '';
  currentTermIndex: number = -1;
  wordCount = 0;
  termSearchQuery: string = '';
  filteredTerms: TermDefinition[] = [];
  private saveTimeout: any;
  
  quillConfig = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['clean'],
      ['link', 'image', 'video'],
      ['add-term', 'add-subpoint']
    ],
    customButtons: {
      'add-term': {
        text: 'Термин',
        onClick: () => this.markAsTerm()
      },
      'add-subpoint': {
        text: 'Подпункт',
        onClick: () => this.markAsSubpoint()
      }
    }
  };
  
  @Output() progressData = new EventEmitter<{
    allTopics: Topic[];
    completedTopics: Topic[];
    totalProgress: number;
    todayProgress: number;
  }>();
  
  todayTopics: Topic[] = [];
  allTopics: Topic[] = [];
  futureTopics: Topic[] = [];
  completedTopics: Topic[] = [];
  
  private readonly planVersion = '1.0.2'
  private readonly STORAGE_KEY = `astronomyProgress_v${this.planVersion}`;
  private readonly PLAN_YAML_PATH = 'assets/data/astronomy/plan.yml';
  private readonly PLAN_STORAGE_KEY = 'astronomyProgress_v1.0.2';

  private topicsSubject = new BehaviorSubject<Topic[]>([]);
  topics$ = this.topicsSubject.asObservable();
  private destroy$ = new RxjsSubject<void>();
  
  constructor(
    private http: HttpClient, 
    private progressDataService: ProgressDataService,
    private sanitizer: DomSanitizer,
    private planManager: PlanManagerService,
    private subjectManager: SubjectManagerService,
    private router: Router
  ) {}
  
  ngOnInit() {
    this.loadProgress();
    
    this.subjectManager.getCurrentSubject().subscribe(subject => {
      if (subject) {
        console.log('Loading plan for subject:', subject);
        this.loadInitialPlan(subject);
      }
    });

    this.planManager.getCurrentPlan().subscribe(plan => {
      if (plan && plan.id !== this.currentPlan?.id) {
        this.currentPlan = plan;
        this.organizeTopics();
      }
    });
  }

  private loadInitialPlan(subject: Subject): void {
    this.planManager.loadPlanForSubject(subject).subscribe(plan => {
      this.currentPlan = plan;
      
      if (this.allTopics.length === 0) {
        this.loadPlanFromYaml().then(yamlPlan => {
          if (yamlPlan) {
            this.currentPlan = {
              ...this.currentPlan!,
              schedule: yamlPlan.schedule,
              total_topics: yamlPlan.total_topics,
              name: yamlPlan.name
            };
            this.planManager.updatePlan(this.currentPlan.id, {
              schedule: yamlPlan.schedule,
              total_topics: yamlPlan.total_topics,
              name: yamlPlan.name
            });
            
            this.initializeAllTopics();
          }
          this.organizeTopics();
        });
      } else {
        this.organizeTopics();
      }
    });
  }

  private async loadPlanFromYaml(): Promise<any> {
    try {
      const yamlContent = await this.http.get(this.PLAN_YAML_PATH, { responseType: 'text' }).toPromise();
      if (yamlContent) {
        return this.planManager['parseYamlPlan'](yamlContent);
      }
    } catch (error) {
      console.error('Error loading YAML plan:', error);
    }
    return null;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.saveTimeout);
  }

  private createTopicFromPlan(topicPlan: any, week: number, day: number): Topic {
    return {
      id: this.generateStableId(topicPlan.title, week, day),
      title: topicPlan.title,
      difficulty: topicPlan.difficulty || 50,
      time: topicPlan.time || '1ч',
      completed: false,
      completedDate: null,
      notes: '',
      dueDate: this.calculateDueDate(week, day),
      week,
      day,
      subtopics: topicPlan.subtopics || [],
      terms: []
    };
  }

  private generateStableId(title: string, week: number, day: number): string {
    const baseString = `${title}_${week}_${day}`;
    let hash = 0;
    for (let i = 0; i < baseString.length; i++) {
      const char = baseString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  editPlan(): void {
    this.router.navigate(['/plan-editor']);
  }

  importPlan(): void {
    const yamlContent = prompt('Введите YAML содержимое плана:');
    if (yamlContent && this.currentPlan) {
      try {
        this.planManager.importFromYaml(this.currentPlan.subjectId, yamlContent);
        alert('План успешно импортирован!');
        this.loadProgress();
        this.organizeTopics();
      } catch (error) {
        alert('Ошибка импорта: ' + error);
      }
    }
  }

  exportPlan(): void {
    if (this.currentPlan) {
      const yamlContent = this.planManager.exportToYaml(this.currentPlan.id);
      this.downloadYamlFile(yamlContent, `${this.currentPlan.name}.yml`);
    }
  }

  private downloadYamlFile(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (!this.selectedTopic || this.isEditingTerm) return;
  
    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 'b':
          event.preventDefault();
          this.formatText('bold');
          break;
        case 'i':
          event.preventDefault();
          this.formatText('italic');
          break;
        case 'k':
          event.preventDefault();
          this.insertLink();
          break;
        case 'enter':
          event.preventDefault();
          this.saveNotes();
          break;
      }
    }
  }

  get selectedTopicWithTerms(): Topic | null {
    return this.selectedTopic as Topic | null;
  }

  editorModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'header': [1, 2, 3, false] }],
      [{ 'color': [] }, { 'background': [] }],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ]
  };
  
  editorStyles = {
    height: '300px',
    backgroundColor: '#fff'
  };

  private loadProgress(): void {
    const savedData = localStorage.getItem(this.STORAGE_KEY);
    
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        console.log('Loaded data from localStorage:', data);
        
        if (data && data.topics && Array.isArray(data.topics) && data.topics.length > 0) {
          this.allTopics = data.topics.map((t: any) => this.normalizeTopic(t));
          console.log('Successfully loaded topics from localStorage:', this.allTopics.length);
          return; // Не инициализируем заново, если есть сохраненные данные
        }
      } catch (e) {
        console.error('Error parsing saved data:', e);
      }
    }
    
    console.log('No valid saved data found, will initialize from plan later');
    // Не инициализируем здесь - дождемся загрузки плана
  }

  private normalizeTopic(t: any): Topic {
    return {
      id: t.id || this.generateId(),
      title: t.title || 'Без названия',
      difficulty: t.difficulty || 50,
      time: t.time || '1ч',
      completed: t.completed || false,
      completedDate: t.completed ? 
        (t.completedDate ? new Date(t.completedDate) : new Date()) : 
        null,
      notes: t.notes || '',
      dueDate: new Date(t.dueDate),
      week: t.week || 1,
      day: t.day || 1,
      subtopics: t.subtopics || [],
      terms: t.terms || [],
      notesHtml: t.notesHtml
    };
  }

  private initializeAllTopics(): void {
    if (!this.currentPlan || !this.currentPlan.schedule) {
      console.warn('No plan available for initialization');
      this.allTopics = [];
      return;
    }

    const planTopics = this.currentPlan.schedule.flatMap((week: any) => 
      week.days.flatMap((day: any) => 
        (day.topics || []).map((topic: any) => this.createTopicFromPlan(topic, week.week, day.day))
      )
    );

    // Если уже есть темы, объединяем, иначе используем темы из плана
    if (this.allTopics.length > 0) {
      this.mergeTopics(planTopics);
    } else {
      this.allTopics = planTopics;
    }

    this.saveProgress();
    console.log('Initialized topics from plan:', this.allTopics.length);
  }

  private mergeTopics(planTopics: Topic[]): void {
    const mergedTopics: Topic[] = [];
    
    planTopics.forEach(planTopic => {
      const existingTopic = this.allTopics.find(t => 
        t.id === planTopic.id || 
        (t.title === planTopic.title && t.week === planTopic.week && t.day === planTopic.day)
      );
      
      if (existingTopic) {
        // Сохраняем существующую тему с прогрессом
        mergedTopics.push({
          ...existingTopic,
          difficulty: planTopic.difficulty,
          time: planTopic.time,
          subtopics: planTopic.subtopics
        });
      } else {
        // Добавляем новую тему из плана
        mergedTopics.push(planTopic);
      }
    });
    
    this.allTopics = mergedTopics;
    console.log('Merged topics:', this.allTopics.length);
  }

  completeFutureTopic(topic: Topic): void {
    this.setTopicCompletion(topic, true);
  }

  private setTopicCompletion(topic: Topic, completed: boolean): void {
    const updatedTopic = {
      ...topic,
      completed,
      completedDate: completed ? new Date() : null
    };
  
    const index = this.allTopics.findIndex(t => t.id === topic.id);
    if (index !== -1) {
      this.allTopics[index] = updatedTopic;
      this.saveProgress();
      
      if (this.selectedTopic?.id === topic.id) {
        this.selectedTopic = {...updatedTopic};
      }
    }
  }

  calculateForecast(): ProgressForecast {
    const completedTopics = this.completedTopics;
    const totalTopics = this.allTopics.length;
    const remainingTopics = totalTopics - completedTopics.length;
    
    const now = new Date();
    const startDate = this.allTopics.reduce((min, t) => 
      t.dueDate < min ? t.dueDate : min, new Date(9999, 0));
    
    const allPeriods = this.calculatePeriodStats(startDate, now);
    
    const weights = {
      recent: 0.6,
      medium: 0.3,
      overall: 0.1
    };
    
    const rates = {
      recent: this.calculateRate(allPeriods.slice(-7)),
      medium: this.calculateRate(allPeriods.slice(-21, -7)),
      overall: this.calculateRate(allPeriods)
    };
    
    const weightedRate = 
      rates.recent * weights.recent + 
      rates.medium * weights.medium + 
      rates.overall * weights.overall;
    
    const difficultyFactor = this.calculateDifficultyFactor();
    const timeFactor = this.calculateTimeFactor();
    const adjustedRate = weightedRate * difficultyFactor * timeFactor;
    
    return {
      expectedEndDate: this.calculateAdjustedEndDate(adjustedRate, remainingTopics, now),
      basedOn: 'topics',
      currentRate: adjustedRate,
      optimisticDate: this.calculateAdjustedEndDate(adjustedRate * 1.2, remainingTopics, now),
      pessimisticDate: this.calculateAdjustedEndDate(adjustedRate * 0.8, remainingTopics, now),
      totalHours: this.calculateTotalPlanHours(),
      completedHours: this.calculateCompletedHours(),
      remainingHours: this.calculateRemainingHours()
    };
  }

  private calculatePeriodStats(start: Date, end: Date): any[] {
    const dailyStats: {[key: string]: number} = {};
    
    this.completedTopics.forEach(topic => {
      if (!topic.completedDate) return;
      const dateKey = topic.completedDate.toISOString().split('T')[0];
      dailyStats[dateKey] = (dailyStats[dateKey] || 0) + 1;
    });
    
    const result = [];
    const currentDay = new Date(start);
    
    while (currentDay <= end) {
      const dateKey = currentDay.toISOString().split('T')[0];
      result.push({
        date: new Date(currentDay),
        count: dailyStats[dateKey] || 0,
        dayOfWeek: currentDay.getDay()
      });
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return result;
  }

  private calculateCompletedHours(): number {
    return this.completedTopics.reduce((sum, topic) => sum + this.parseTimeToHours(topic.time), 0);
  }
  
  private calculateRemainingHours(): number {
    return this.allTopics
      .filter(topic => !topic.completed)
      .reduce((sum, topic) => sum + this.parseTimeToHours(topic.time), 0);
  }
  
  private calculateTotalPlanHours(): number {
    return this.allTopics.reduce((sum, topic) => sum + this.parseTimeToHours(topic.time), 0);
  }
  
  public calculateAverageDifficulty(): number {
    if (this.allTopics.length === 0) return 0;
    return this.allTopics.reduce((sum, topic) => sum + (topic.difficulty || 50), 0) / this.allTopics.length;
  }
  
  public daysBetween(endDate: Date): number {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateRate(periods: any[]): number {
    if (periods.length === 0) return 0;
    
    const workDays = periods.filter(p => p.dayOfWeek !== 0 && p.dayOfWeek !== 6);
    const totalCompleted = workDays.reduce((sum, day) => sum + day.count, 0);
    
    return workDays.length > 0 ? totalCompleted / workDays.length : 0;
  }
  
  private calculateDifficultyFactor(): number {
    if (this.completedTopics.length === 0) return 1;
    
    const completedDifficulty = this.completedTopics.reduce(
      (sum, t) => sum + (t.difficulty || 50), 0) / this.completedTopics.length;
    
    const remainingDifficulty = this.allTopics
      .filter(t => !t.completed)
      .reduce((sum, t) => sum + (t.difficulty || 50), 0) / 
      (this.allTopics.length - this.completedTopics.length) || 50;
    
    return 1 + (remainingDifficulty - completedDifficulty) / 200;
  }
  
  private calculateTimeFactor(): number {
    if (this.completedTopics.length === 0) return 1;
    
    const avgCompletedTime = this.completedTopics.reduce(
      (sum, t) => sum + this.parseTimeToHours(t.time), 0) / this.completedTopics.length;
    
    const avgRemainingTime = this.allTopics
      .filter(t => !t.completed)
      .reduce((sum, t) => sum + this.parseTimeToHours(t.time), 0) / 
      (this.allTopics.length - this.completedTopics.length) || 1;
    
    return avgCompletedTime / avgRemainingTime;
  }
  
  private calculateAdjustedEndDate(rate: number, remaining: number, fromDate: Date): Date {
    if (rate <= 0) {
      const futureDate = new Date(fromDate);
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      return futureDate;
    }
    
    let date = new Date(fromDate);
    let daysNeeded = remaining / rate;
    let workDaysPassed = 0;
    
    while (daysNeeded > 0) {
      date.setDate(date.getDate() + 1);
      
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;
      
      const isHoliday = this.isHoliday(date);
      if (isHoliday) continue;
      
      workDaysPassed++;
      daysNeeded--;
    }
    
    return date;
  }
  
  private isHoliday(date: Date): boolean {
    const holidays = [
      '01-01', '01-02', '01-07', '02-23', '03-08', 
      '05-01', '05-09', '06-12', '11-04'
    ];
    
    const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return holidays.includes(monthDay);
  }
  
  private parseTimeToHours(timeStr: string): number {
    if (!timeStr) return 1;
    
    let hours = 0;
    let minutes = 0;
    
    const hourMatch = timeStr.match(/(\d+\.?\d*)\s*(ч|час|часа|hours?|h)/i);
    if (hourMatch) {
      hours = parseFloat(hourMatch[1]);
    }
    
    const minuteMatch = timeStr.match(/(\d+)\s*(мин|минут|minutes?|m)/i);
    if (minuteMatch) {
      minutes = parseInt(minuteMatch[1], 10);
    }
    
    return hours + (minutes / 60);
  }
  
  private getDaysPassed(): number {
    if (this.allTopics.length === 0) return 0;
    
    const startDate = this.allTopics.reduce((min, t) => 
      t.dueDate < min ? t.dueDate : min, new Date(9999, 0));
    startDate.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - startDate.getTime();
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }
  
  private calculateEndDate(rate: number, remaining: number): Date {
    if (rate <= 0) {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      return futureDate;
    }
    
    const daysNeeded = remaining / rate;
    const endDate = new Date();
    
    let daysAdded = 0;
    while (daysAdded < daysNeeded) {
      endDate.setDate(endDate.getDate() + 1);
      
      const dayOfWeek = endDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        daysAdded++;
      }
    }
    
    return endDate;
  }

  private processNotesForDisplay(): void {
    this.allTopics.forEach(topic => {
      if (!topic.notes) {
        topic.notesHtml = 'Заметок нет';
        return;
      }

      let processedNotes = topic.notes;
      
      if (topic.terms?.length) {
        topic.terms.forEach((term, index) => {
          const regex = new RegExp(`(${term.term})(?![^<]*>|[^<>]*<\/)`, 'gi');
          processedNotes = processedNotes.replace(
            regex, 
            `<strong class="term" data-term="${index}">$1<sup>${index + 1}</sup></strong>`
          );
        });
      }

      processedNotes = processedNotes.replace(
        /(^|\n)(\s*)[•\-]\s+(.*?)(?=\n|$)/g, 
        '$1$2<span class="subpoint">$3</span>'
      );

      topic.notesHtml = this.sanitizer.bypassSecurityTrustHtml(processedNotes);
    });
  }

  selectTopic(topic: Topic): void {
    this.selectedTopic = { ...topic };
    this.isEditingTerm = false;
    this.currentTerm = null;
    
    setTimeout(() => {
      this.focusEditor();
      this.wordCount = this.countWords(this.selectedTopic?.notes || '');
      this.autoSave();
    });
  }

  private autoSave(): void {
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      if (this.selectedTopic) {
        this.saveNotes();
      }
    }, 1000);
  }

  cancelTermEdit(): void {
    this.isEditingTerm = false;
    this.currentTerm = null;
  }

  editTerm(index: number): void {
    if (!this.selectedTopic?.terms || index < 0 || index >= this.selectedTopic.terms.length) {
      return;
    }
    this.currentTerm = { ...this.selectedTopic.terms[index] };
  }

  updateFilteredTerms(): void {
    if (!this.selectedTopic?.terms) {
      this.filteredTerms = [];
      return;
    }
    
    this.filteredTerms = this.selectedTopic.terms.filter(term => 
      term.term.toLowerCase().includes(this.termSearchQuery.toLowerCase()) ||
      term.definition.toLowerCase().includes(this.termSearchQuery.toLowerCase())
    );
  }  

  markAsSubpoint(): void {
    if (!this.selectedTopic) return;
    
    const selection = window.getSelection();
    if (!selection || selection.toString().trim().length === 0) return;
    
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.className = 'subpoint';
    span.textContent = selection.toString();
    
    range.deleteContents();
    range.insertNode(span);
    selection.removeAllRanges();
    
    if (this.selectedTopic) {
      const editor = document.querySelector('.notes-editor-content');
      if (editor) {
        this.selectedTopic.notes = editor.innerHTML;
      }
    }
  }

  saveNotes(): void {
    if (!this.selectedTopic) return;
    
    if (this.selectedTopic.completed && !this.selectedTopic.completedDate) {
      this.selectedTopic.completedDate = new Date();
    }

    const topicIndex = this.allTopics.findIndex(t => t.id === this.selectedTopic!.id);
    if (topicIndex !== -1) {
      this.allTopics[topicIndex] = { ...this.selectedTopic! };
      this.saveProgress();
      this.organizeTopics();
      
      this.selectedTopic = { ...this.allTopics[topicIndex] };
    }
    
    this.autoSaved = true;
    console.log('Notes saved for topic:', this.selectedTopic.title);
  }

  onEditorInput(event: Event): void {
    const element = event.target as HTMLElement;
    if (this.selectedTopic) {
      this.selectedTopic.notes = element.innerHTML;
      this.wordCount = this.countWords(element.innerText);
      
      clearTimeout(this.saveTimeout);
      this.autoSaved = false;
      this.saveTimeout = setTimeout(() => {
        this.saveNotes();
        this.autoSaved = true;
      }, 500);
    }
  }
  
  formatText(command: string): void {
    document.execCommand(command, false);
    this.focusEditor();
  }
  
  insertList(type: 'ul' | 'ol'): void {
    document.execCommand('insert' + (type === 'ol' ? 'Ordered' : 'Unordered') + 'List');
    this.focusEditor();
  }
  
  insertLink(): void {
    const url = prompt('Enter URL:', 'http://');
    if (url) {
      document.execCommand('createLink', false, url);
    }
    this.focusEditor();
  }
  
  insertImage(): void {
    const url = prompt('Enter image URL:', 'http://');
    if (url) {
      document.execCommand('insertImage', false, url);
    }
    this.focusEditor();
  }

  addNewTerm(): void {
    if (!this.selectedTopic) return;
    
    if (!this.selectedTopic.terms) {
      this.selectedTopic.terms = [];
    }
  
    this.currentTerm = {
      term: '',
      definition: ''
    };
    
    setTimeout(() => {
      const input = document.querySelector('.term-input') as HTMLInputElement;
      input?.focus();
    });
  }

  addTerm(): void {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
  
    if (selectedText) {
      this.markAsTerm();
      return;
    }
  
    const term = prompt('Enter term:');
    if (!term) return;

    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
  
    const span = document.createElement('span');
    span.className = 'term-highlight';
    span.textContent = term;
  
    if (range) {
      range.deleteContents();
      range.insertNode(span);
    }
  
    if (!this.selectedTopic) {
      console.warn('No topic selected');
      return;
    }
  
    if (!this.selectedTopic.terms) {
      this.selectedTopic.terms = [];
    }
  
    const newTerm = {
      term: term,
      definition: ''
    };
  
    const existingTermIndex = this.selectedTopic.terms.findIndex(t => t['term'] === term);
    
    if (existingTermIndex >= 0) {
      this.currentTerm = { ...this.selectedTopic.terms[existingTermIndex] };
    } else {
      this.selectedTopic.terms.push(newTerm);
      this.currentTerm = { ...newTerm };
    }
  
    this.isEditingTerm = true;
  }
  
  private focusEditor(): void {
    const editor = document.querySelector('.editor-content') as HTMLElement;
    editor?.focus();
  }
  
  private countWords(text: string): number {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }  

  markAsTerm(): void {
    if (!this.selectedTopic) return;
    
    const selection = window.getSelection();
    if (!selection || selection.toString().trim().length === 0) return;
    
    const termText = selection.toString().trim();
    this.currentTerm = {
      term: termText,
      definition: ''
    };
    
    this.isEditingTerm = true;
    
    if (!this.selectedTopic.terms) {
      this.selectedTopic.terms = [];
    }
    
    const existingTermIndex = this.selectedTopic.terms.findIndex(t => t.term === termText);
    if (existingTermIndex >= 0) {
      this.currentTerm = this.selectedTopic.terms[existingTermIndex];
    }
  }

  private parseTopicString(topicStr: string): { title: string, difficulty: number, time: string } {
    if (!topicStr.includes('(')) {
      return { title: topicStr, difficulty: 0, time: '' };
    }
    
    const titlePart = topicStr.split('(')[0].trim();
    const paramsPart = topicStr.match(/\(([^)]+)\)/)?.[1] || '';
    
    let difficulty = 0;
    let time = '';
    
    paramsPart.split(',').forEach(param => {
      if (param.includes('сложность:')) {
        difficulty = parseInt(param.split(':')[1]) || 0;
      } else if (param.includes('время:')) {
        time = param.split(':')[1].trim();
      }
    });
    
    return { title: titlePart, difficulty, time };
  }

  getCompletedTodayCount(): number {
    return this.todayTopics.filter(t => t.completed).length;
  }
  
  get completedTopicsCount(): number {
    return this.allTopics.filter(t => t.completed).length;
  }
  
  get todayCompletedCount(): number {
    return this.todayTopics.filter(t => t.completed).length;
  }
  
  private findExistingTopic(title: string, week: number, day: number): Topic | undefined {
    return this.allTopics.find(t => 
      t.title === title && 
      t.week === week && 
      t.day === day
    );
  }

  toggleTopicCompletion(topic: Topic): void {
    const updatedTopic = {
      ...topic,
      completed: !topic.completed,
      completedDate: !topic.completed ? new Date() : null
    };

    const index = this.allTopics.findIndex(t => t.id === topic.id);
    if (index !== -1) {
      this.allTopics[index] = updatedTopic;
      this.saveProgress();
      this.organizeTopics();
      
      if (this.selectedTopic?.id === topic.id) {
        this.selectedTopic = { ...updatedTopic };
      }
    }
  }  

  private saveProgress(): void {
    const data = {
      topics: this.allTopics.map(topic => ({
        id: topic.id,
        title: topic.title,
        difficulty: topic.difficulty,
        time: topic.time,
        completed: topic.completed,
        completedDate: topic.completed ? 
          (topic.completedDate?.toISOString() || new Date().toISOString()) : 
          null,
        notes: topic.notes,
        dueDate: topic.dueDate.toISOString(),
        week: topic.week,
        day: topic.day,
        subtopics: topic.subtopics || [],
        terms: topic.terms || []
      })),
      lastUpdated: new Date().toISOString(),
      version: this.planVersion
    };
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    console.log('Progress saved to localStorage:', data.topics.length, 'topics');
  }

  private calculateDueDate(week: number, day: number): Date {
    const startDate = new Date(2025, 5, 1);
    const daysToAdd = (week - 1) * 7 + (day - 1);
    const dueDate = new Date(startDate);
    dueDate.setDate(startDate.getDate() + daysToAdd);
    return dueDate;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private organizeTopics(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.todayTopics = this.allTopics.filter(topic => {
      const topicDate = new Date(topic.dueDate);
      topicDate.setHours(0, 0, 0, 0);
      return topicDate.getTime() === today.getTime();
    });

    this.futureTopics = this.allTopics
      .filter(topic => {
        const topicDate = new Date(topic.dueDate);
        topicDate.setHours(0, 0, 0, 0);
        return topicDate > today && !topic.completed;
      })
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    this.completedTopics = this.allTopics
      .filter(topic => topic.completed)
      .sort((a, b) => (b.completedDate || new Date(0)).getTime() - (a.completedDate || new Date(0)).getTime());

    this.progressData.emit({
      allTopics: this.allTopics,
      completedTopics: this.completedTopics,
      totalProgress: this.totalProgress,
      todayProgress: this.todayProgress
    });
    this.forecast = this.calculateForecast();
  }

  setViewMode(mode: 'today' | 'diary' | 'future' | 'charts') {
    this.viewMode = mode;
    this.selectedTopic = null;
    this.isEditingTerm = false;
    this.currentTerm = null;
  }

  getFilteredTopics(): Topic[] {
    let topics = this.allTopics;
    if (this.searchQuery) {
      topics = topics.filter(t => 
        t.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (t.notes && t.notes.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (t.terms && t.terms.some(term => 
          term.term.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          term.definition.toLowerCase().includes(this.searchQuery.toLowerCase())
        ))
      );
    }
    switch (this.filter) {
      case 'completed': return topics.filter(t => t.completed);
      case 'pending': return topics.filter(t => !t.completed);
      default: return topics;
    }
  }

  get todayProgress() {
    const total = this.todayTopics.length;
    const completed = this.todayTopics.filter(t => t.completed).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  get totalProgress() {
    const total = this.allTopics.length;
    const completed = this.allTopics.filter(t => t.completed).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  showTermsEditor(): void {
    if (!this.selectedTopic) return;
    
    if (!this.selectedTopic.terms) {
      this.selectedTopic.terms = [];
    }
    
    this.filteredTerms = [...this.selectedTopic.terms];
    this.isEditingTerm = true;
    this.currentTermIndex = this.filteredTerms.length > 0 ? 0 : -1;
  }
  
  addEmptyTerm(): void {
    this.filteredTerms.push({
      term: '',
      definition: ''
    });
    this.currentTermIndex = this.filteredTerms.length - 1;
  }
  
  saveTerms(): void {
    if (!this.selectedTopic) return;
    
    this.selectedTopic.terms = this.filteredTerms.filter(t => t.term.trim() !== '');
    this.saveNotes();
    this.isEditingTerm = false;
  }
  
  removeTerm(index: number): void {
    this.filteredTerms.splice(index, 1);
    if (this.currentTermIndex >= index) {
      this.currentTermIndex = Math.max(0, this.currentTermIndex - 1);
    }
  }
  
  get filteredTermsList(): TermDefinition[] {
    if (!this.termSearch) {
      return this.filteredTerms;
    }
    const search = this.termSearch.toLowerCase();
    return this.filteredTerms.filter(term => 
      term.term.toLowerCase().includes(search) ||
      term.definition.toLowerCase().includes(search)
    );
  }
}