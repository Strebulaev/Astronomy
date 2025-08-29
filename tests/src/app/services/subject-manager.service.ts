import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Subject, SubjectConfig } from '../models/subject.model';
import { HistoryService } from './history.service';
import { OlympiadService } from './olympiad.service';

@Injectable({
  providedIn: 'root'
})
export class SubjectManagerService {
    private readonly STORAGE_KEY = 'subjects_list';
    private readonly CURRENT_SUBJECT_KEY = 'current_subject_id';
    
    private subjects: Subject[] = [];
    private currentSubject$ = new BehaviorSubject<Subject | null>(null);
    historyService: HistoryService | undefined;
    olympiadService: OlympiadService | undefined;

    constructor() {
        this.initializeSubjects();
    }

    getSubjects(): Subject[] {
        return this.subjects.slice();
    }

    getCurrentSubject(): Observable<Subject | null> {
        return this.currentSubject$.asObservable();
    }

    getCurrentSubjectValue(): Subject | null {
        return this.currentSubject$.value;
    }

    addSubject(name: string, config: SubjectConfig, icon: string = 'school', color: string = '#3f51b5'): void {
        const newSubject: Subject = {
        id: this.generateId(),
        name,
        icon,
        color,
        isActive: true,
        createdAt: new Date(),
        ...config
        };

        this.subjects.push(newSubject);
        this.saveSubjects();
        
        if (this.subjects.length === 1) {
        this.setCurrentSubject(newSubject);
        }
    }

    removeSubject(subjectId: string): void {
        this.historyService?.clearSubjectHistory(subjectId);
        
        this.olympiadService?.removeSubjectOlympiads(subjectId);
        
        this.subjects = this.subjects.filter(s => s.id !== subjectId);
        this.subjects = this.subjects.filter(s => s.id !== subjectId);
        
        if (this.currentSubject$.value?.id === subjectId) {
        if (this.subjects.length > 0) {
            this.setCurrentSubject(this.subjects[0]);
        } else {
            this.setCurrentSubject(null);
        }
        }
        
        this.saveSubjects();
    }

    setCurrentSubject(subject: Subject | null): void {
        this.currentSubject$.next(subject);
        if (subject) {
        localStorage.setItem(this.CURRENT_SUBJECT_KEY, subject.id);
        } else {
        localStorage.removeItem(this.CURRENT_SUBJECT_KEY);
        }
    }

    getDefaultConfig(subjectName: string): SubjectConfig {
        const slug = subjectName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return {
        planPath: `assets/data/${slug}/plan.yml`,
        questionsPath: `assets/data/${slug}/questions.yml`,
        tagsPath: `assets/data/${slug}/tags.yml`,
        testsPath: `assets/data/${slug}/tests/`
        };
    }

    hasSubjects(): boolean {
        return this.subjects.length > 0;
    }

    private initializeSubjects(): void {
        this.loadSubjects();
        
        // Если нет предметов - создаем астрономию по умолчанию
        if (this.subjects.length === 0) {
            this.createDefaultSubject();
        } else {
            this.loadCurrentSubject();
        }
        
        // Если нет текущего предмета - выбираем первый
        if (!this.currentSubject$.value && this.subjects.length > 0) {
            this.setCurrentSubject(this.subjects[0]);
        }
    }

    private loadSubjects(): void {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
        try {
            this.subjects = JSON.parse(stored).map((s: any) => ({
            ...s,
            createdAt: new Date(s.createdAt)
            }));
        } catch (e) {
            console.error('Error loading subjects', e);
            this.subjects = [];
        }
        }
    }

    private loadCurrentSubject(): void {
        const currentId = localStorage.getItem(this.CURRENT_SUBJECT_KEY);
        if (currentId) {
        const subject = this.subjects.find(s => s.id === currentId);
        if (subject) {
            this.currentSubject$.next(subject);
        }
        }
    }

    private saveSubjects(): void {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.subjects));
    }

    private createDefaultSubject(): void {
        const defaultSubject: Subject = {
          id: 'astronomy',
          name: 'Астрономия',
          icon: 'star',
          color: '#3f51b5',
          planPath: '/assets/data/astronomy/plan.yml',
          questionsPath: '/assets/data/astronomy/questions.yml',
          tagsPath: '/assets/data/astronomy/tags.yml',
          testsPath: '/assets/data/astronomy/tests/',
          isActive: true,
          createdAt: new Date()
        };
      
        this.subjects.push(defaultSubject);
        this.saveSubjects();
        this.setCurrentSubject(defaultSubject);
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}