// services/olympiad.service.ts
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Olympiad } from '../models/olympiad.model';

@Injectable({ providedIn: 'root' })
export class OlympiadService {
  private readonly STORAGE_KEY = 'astronomy_olympiads';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  getOlympiads(): Olympiad[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    const olympiadsJson = localStorage.getItem(this.STORAGE_KEY);
    return olympiadsJson ? JSON.parse(olympiadsJson) : [];
  }

  addOlympiad(olympiad: Omit<Olympiad, 'id' | 'uploadDate'>): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const olympiads = this.getOlympiads();
    const newOlympiad: Olympiad = {
      ...olympiad,
      id: this.generateId(),
      uploadDate: new Date()
    };
    olympiads.unshift(newOlympiad);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(olympiads));
  }

  removeOlympiad(id: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const olympiads = this.getOlympiads().filter(item => item.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(olympiads));
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }
}