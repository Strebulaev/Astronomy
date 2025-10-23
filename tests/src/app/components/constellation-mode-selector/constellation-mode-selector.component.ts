import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameMode } from '../../models/constellation.model';
import { ConstellationService } from '../../services/constellation.service';

@Component({
  selector: 'app-constellation-mode-selector',
  templateUrl: './constellation-mode-selector.component.html',
  styleUrls: ['./constellation-mode-selector.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class ConstellationModeSelectorComponent implements OnInit {
  gameModes: GameMode[] = [];
  selectedMode: GameMode | null = null;

  constructor(
    private constellationService: ConstellationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.gameModes = this.constellationService.getGameModes();
  }

  selectMode(mode: GameMode): void {
    this.selectedMode = mode;
  }

  startGame(): void {
    if (this.selectedMode) {
      // Передаем режим через queryParams вместо state
      this.router.navigate(['/constellation-quiz'], { 
        queryParams: { mode: this.selectedMode.id }
      });
    }
  }
  getConstellationCount(mode: GameMode): number {
    // Здесь можно предварительно загрузить и посчитать созвездия для каждого режима
    // Или просто показать примерные числа на основе CONSTELLATION_DATA
    if (mode.hemisphere === 'north') return 36;
    if (mode.hemisphere === 'south') return 52;
    if (mode.zodiacOnly) return 12;
    return 88; // все созвездия
  }
  getModeIcon(mode: GameMode): string {
    if (mode.type === 'name') return '🔍';
    if (mode.type === 'image') return '🖼️';
    if (mode.zodiacOnly) return '♈';
    if (mode.hemisphere === 'north') return '🌎';
    if (mode.hemisphere === 'south') return '🌍';
    return '🌌';
  }
}