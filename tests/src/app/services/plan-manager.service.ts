import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Subject } from '../models/subject.model';

export interface Plan {
  id: string;
  subjectId: string;
  name: string;
  description?: string;
  total_topics: number;
  schedule: WeekPlan[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WeekPlan {
  week: number;
  days: DayPlan[];
}

export interface DayPlan {
  day: number;
  date?: string;
  topics: TopicPlan[];
}

export interface TopicPlan {
  id: string;
  title: string;
  difficulty: number;
  time: string;
  subtopics?: string[];
  resources?: string[];
  completed?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PlanManagerService {
  private readonly STORAGE_KEY = 'subject_plans';
  private plans: Plan[] = [];
  private currentPlan$ = new BehaviorSubject<Plan | null>(null);

  constructor() {
    this.loadPlans();
  }

  createPlan(subjectId: string, name: string, description?: string): Plan {
    const plan: Plan = {
      id: this.generateId(),
      subjectId,
      name,
      description,
      total_topics: 0,
      schedule: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.plans.push(plan);
    this.savePlans();
    this.currentPlan$.next(plan);
    return plan;
  }

  loadPlanForSubject(subject: Subject): Observable<Plan> {
    return new Observable(observer => {
      let plan = this.plans.find(p => p.subjectId === subject.id);
      
      if (!plan) {
        plan = this.createPlan(subject.id, `План изучения ${subject.name}`);
      }
      
      this.currentPlan$.next(plan);
      observer.next(plan);
      observer.complete();
    });
  }

  updatePlan(planId: string, updates: Partial<Plan>): void {
    const index = this.plans.findIndex(p => p.id === planId);
    if (index !== -1) {
      this.plans[index] = {
        ...this.plans[index],
        ...updates,
        updatedAt: new Date()
      };
      this.savePlans();
      
      if (this.currentPlan$.value?.id === planId) {
        this.currentPlan$.next(this.plans[index]);
      }
    }
  }

  importFromYaml(subjectId: string, yamlContent: string): Plan {
    try {
      const planData = this.parseYamlPlan(yamlContent);
      const plan = this.createPlan(subjectId, planData.name, planData.description);
      
      this.updatePlan(plan.id, {
        schedule: planData.schedule,
        total_topics: planData.total_topics
      });
      
      return plan;
    } catch (error) {
      throw new Error('Ошибка импорта YAML: ' + error);
    }
  }

  exportToYaml(planId: string): string {
    const plan = this.plans.find(p => p.id === planId);
    if (!plan) throw new Error('План не найден');

    return this.generateYaml(plan);
  }

  getCurrentPlan(): Observable<Plan | null> {
    return this.currentPlan$.asObservable();
  }

  deletePlan(planId: string): void {
    this.plans = this.plans.filter(p => p.id !== planId);
    this.savePlans();
    
    if (this.currentPlan$.value?.id === planId) {
      this.currentPlan$.next(null);
    }
  }

  private parseYamlPlan(yamlContent: string): any {
    const lines = yamlContent.split('\n');
    const plan: any = { schedule: [] };
    let currentWeek: any = null;
    let currentDay: any = null;

    lines.forEach(line => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('name:')) {
        plan.name = trimmed.replace('name:', '').trim();
      } else if (trimmed.startsWith('description:')) {
        plan.description = trimmed.replace('description:', '').trim();
      } else if (trimmed.startsWith('week:')) {
        if (currentWeek) plan.schedule.push(currentWeek);
        currentWeek = { week: parseInt(trimmed.replace('week:', '').trim()), days: [] };
      } else if (trimmed.startsWith('day:')) {
        if (currentDay && currentWeek) currentWeek.days.push(currentDay);
        currentDay = { day: parseInt(trimmed.replace('day:', '').trim()), topics: [] };
      } else if (trimmed.startsWith('-')) {
        if (currentDay) {
          const topic = this.parseTopicLine(trimmed);
          currentDay.topics.push(topic);
        }
      }
    });

    if (currentDay && currentWeek) currentWeek.days.push(currentDay);
    if (currentWeek) plan.schedule.push(currentWeek);

    plan.total_topics = plan.schedule.reduce((total: number, week: any) => {
      return total + week.days.reduce((weekTotal: number, day: any) => {
        return weekTotal + day.topics.length;
      }, 0);
    }, 0);

    return plan;
  }

  private parseTopicLine(line: string): TopicPlan {
    const match = line.match(/-\s*(.+?)\s*(?:\((.*)\))?/);
    if (!match) return { 
      id: this.generateId(), 
      title: line.substring(2), 
      difficulty: 50, 
      time: '1ч' 
    };

    const title = match[1].trim();
    const params = match[2] || '';
    
    let difficulty = 50;
    let time = '1ч';

    if (params) {
      const difficultyMatch = params.match(/сложность:\s*(\d+)/i);
      const timeMatch = params.match(/время:\s*([^,)]+)/i);
      
      if (difficultyMatch) difficulty = parseInt(difficultyMatch[1]);
      if (timeMatch) time = timeMatch[1].trim();
    }

    return { 
      id: this.generateId(), 
      title, 
      difficulty, 
      time 
    };
  }

  private generateYaml(plan: Plan): string {
    let yaml = `name: ${plan.name}\n`;
    if (plan.description) yaml += `description: ${plan.description}\n`;
    yaml += `total_topics: ${plan.total_topics}\n\n`;
    
    plan.schedule.forEach(week => {
      yaml += `week: ${week.week}\n`;
      week.days.forEach(day => {
        yaml += `  day: ${day.day}\n`;
        day.topics.forEach(topic => {
          yaml += `    - ${topic.title} (сложность: ${topic.difficulty}, время: ${topic.time})\n`;
        });
      });
      yaml += '\n';
    });

    return yaml;
  }

  private loadPlans(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        this.plans = JSON.parse(stored);
      } catch (error) {
        console.error('Error loading plans:', error);
        this.plans = [];
      }
    }
  }

  private savePlans(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.plans));
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}