import { Injectable } from '@angular/core';
import { Olympiad } from '../models/olympiad.model';

@Injectable({ providedIn: 'root' })
export class OlympiadService {
  private olympiads: Olympiad[] = [];

  constructor() {
    this.loadFromLocalStorage();
  }

  getOlympiads(): Olympiad[] {
    return this.olympiads.slice();
  }

  getOlympiadsBySubject(subjectId: string): Olympiad[] {
    return this.olympiads.filter(o => o.subjectId === subjectId);
  }

  getOlympiadById(id: string): Olympiad | undefined {
    return this.olympiads.find(o => o.id === id);
  }

  addOlympiad(olympiad: Omit<Olympiad, 'id' | 'createdAt'>): void {
    const newOlympiad: Olympiad = {
      ...olympiad,
      id: this.generateId(),
      createdAt: new Date()
    };
    this.olympiads.push(newOlympiad);
    this.saveToLocalStorage();
  }

  updateOlympiad(updatedOlympiad: Olympiad): void {
    const index = this.olympiads.findIndex(o => o.id === updatedOlympiad.id);
    if (index !== -1) {
      this.olympiads[index] = updatedOlympiad;
      this.saveToLocalStorage();
    }
  }

  removeOlympiad(id: string): void {
    this.olympiads = this.olympiads.filter(o => o.id !== id);
    this.saveToLocalStorage();
  }

  removeSubjectOlympiads(subjectId: string): void {
    this.olympiads = this.olympiads.filter(o => o.subjectId !== subjectId);
    this.saveToLocalStorage();
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  private loadFromLocalStorage(): void {
    const saved = localStorage.getItem('olympiads');
    if (saved) {
      try {
        this.olympiads = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse olympiads from localStorage', e);
        this.olympiads = [];
      }
    }
  }

  private saveToLocalStorage(): void {
    localStorage.setItem('olympiads', JSON.stringify(this.olympiads));
  }
}