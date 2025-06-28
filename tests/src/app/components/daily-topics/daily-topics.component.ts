import { Component, NgModule, OnInit } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { CommonModule, NgFor, NgIf, DatePipe, NgClass } from '@angular/common';
import * as yaml from 'js-yaml';
import { HttpClient } from '@angular/common/http';

interface Topic {
  id: string;
  title: string;
  difficulty: number;
  time: string;
  completed: boolean;
  completedDate: Date | null;
  notes: string;
  dueDate: Date;
  week: number;
  day: number;
  subtopics?: string[];
}

interface DayPlan {
  day: number;
  topics: (string | { topic: string, subtopics: string[] })[];
}

interface WeekPlan {
  week: number;
  days: DayPlan[];
}

interface Plan {
  name: string;
  total_topics: number;
  schedule: WeekPlan[];
}

@Component({
  selector: 'app-daily-topics',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, NgClass],
  templateUrl: './daily-topics.component.html',
  styleUrls: ['./daily-topics.component.css']
})
export class DailyTopicsComponent implements OnInit {
  viewMode: 'today' | 'diary' | 'future' = 'today';
  selectedTopic: Topic | null = null;
  searchQuery: string = '';
  currentDate: Date = new Date();
  filter: 'all' | 'completed' | 'pending' = 'all';
  
  plan: Plan = {
    name: '',
    total_topics: 0,
    schedule: []
  };
  todayTopics: Topic[] = [];
  allTopics: Topic[] = [];
  futureTopics: Topic[] = [];
  completedTopics: Topic[] = [];

  constructor(private http: HttpClient) {}

  async ngOnInit() {
    await this.loadPlan();
    this.loadProgress();
    this.organizeTopics();
  }

  private async loadPlan() {
    try {
      const yamlText = await this.http.get('assets/plan.yml', { 
        responseType: 'text' 
      }).toPromise();
      
      if (!yamlText) {
        throw new Error('Empty YAML response');
      }
      
      // Загружаем данные и явно указываем тип
      const loadedData = yaml.load(yamlText) as any;
      
      // Проверяем структуру данных
      if (loadedData && (loadedData.plan || loadedData.name)) {
        this.plan = loadedData.plan || loadedData;
        
        if (!this.plan?.name) {
          throw new Error('Invalid YAML structure - missing name');
        }
        
        console.log('Plan loaded:', this.plan);
        this.initializeAllTopics();
        this.organizeTopics();
      } else {
        throw new Error('Invalid YAML structure');
      }
    } catch (e) {
      console.error('Error loading plan:', e);
      this.plan = this.getDefaultPlan();
      this.initializeAllTopics();
    }
  }
  
  private getDefaultPlan(): Plan {
    return {
      name: 'Default Plan',
      total_topics: 0,
      schedule: []
    };
  }
  private parseTopicString(topicStr: string): { title: string, difficulty: number, time: string } {
    // Если нет скобок, возвращаем всю строку как title
    if (!topicStr.includes('(') || !topicStr.includes(')')) {
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
  private loadProgress() {
    const savedData = localStorage.getItem('astronomyProgress');
    if (savedData) {
      const data = JSON.parse(savedData);
      this.allTopics = data.topics.map((t: any) => ({
        ...t,
        dueDate: new Date(t.dueDate),
        completedDate: t.completedDate ? new Date(t.completedDate) : null
      }));
    } else {
      this.initializeAllTopics();
    }
  }
  get completedTopicsCount(): number {
    return this.allTopics.filter(t => t.completed).length;
  }
  
  get todayCompletedCount(): number {
    return this.todayTopics.filter(t => t.completed).length;
  }
  private initializeAllTopics() {
    console.log('Initializing topics from plan:', this.plan);
    this.allTopics = [];
    
    if (!this.plan?.schedule) {
      console.error('No schedule in plan');
      return;
    }
    
    this.plan.schedule.forEach((week: any) => {
      week.days.forEach((day: any) => {
        day.topics.forEach((topic: any) => {
          try {
            if (typeof topic === 'string') {
              const parsed = this.parseTopicString(topic);
              const dueDate = this.calculateDueDate(week.week, day.day);
              
              console.log(`Creating topic:`, {
                title: parsed.title,
                week: week.week,
                day: day.day,
                dueDate
              });
              
              this.allTopics.push({
                id: this.generateId(),
                ...parsed,
                completed: false,
                completedDate: null,
                notes: '',
                dueDate,
                week: week.week,
                day: day.day
              });
            }
          } catch (e) {
            console.error('Error creating topic:', e, 'Topic:', topic);
          }
        });
      });
    });
    
    console.log('Total topics created:', this.allTopics.length);
    this.saveProgress();
  }

  private calculateDueDate(week: number, day: number): Date {
    // Фиксированная дата начала - 1 июня 2025
    const startDate = new Date(2025, 5, 1); // Месяцы 0-11 (5 = июнь)
    const daysToAdd = (week - 1) * 7 + (day - 1);
    const dueDate = new Date(startDate);
    dueDate.setDate(startDate.getDate() + daysToAdd);
    
    console.log(`Week ${week}, Day ${day} -> ${dueDate}`);
    return dueDate;
  }
  private organizeTopics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Для отладки можно вывести текущую дату
    console.log('Сегодняшняя дата:', today);
    
    this.todayTopics = this.allTopics.filter(topic => {
      const topicDate = new Date(topic.dueDate);
      topicDate.setHours(0, 0, 0, 0);
      // Для отладки можно вывести даты тем
      console.log(`Тема "${topic.title}": ${topicDate}`);
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
  }

  toggleTopicCompletion(topic: Topic) {
    topic.completed = !topic.completed;
    topic.completedDate = topic.completed ? new Date() : null;
    this.saveProgress();
    this.organizeTopics();
  }

  completeFutureTopic(topic: Topic) {
    topic.completed = true;
    topic.completedDate = new Date();
    this.saveProgress();
    this.organizeTopics();
  }

  private saveProgress() {
    const data = {
      topics: this.allTopics,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('astronomyProgress', JSON.stringify(data));
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  selectTopic(topic: Topic) {
    this.selectedTopic = { ...topic };
  }

  saveNotes() {
    if (!this.selectedTopic) return;
    
    const topicIndex = this.allTopics.findIndex(t => t.id === this.selectedTopic!.id);
    if (topicIndex !== -1) {
      this.allTopics[topicIndex].notes = this.selectedTopic.notes;
    }
    
    this.saveProgress();
    this.selectedTopic = null;
  }

  setViewMode(mode: 'today' | 'diary' | 'future') {
    this.viewMode = mode;
    this.selectedTopic = null;
  }

  getFilteredTopics(): Topic[] {
    let topics = this.allTopics;
    if (this.searchQuery) {
      topics = topics.filter(t => 
        t.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (t.notes && t.notes.toLowerCase().includes(this.searchQuery.toLowerCase()))
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
}