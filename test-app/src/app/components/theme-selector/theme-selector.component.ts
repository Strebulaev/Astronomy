import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TestLoaderService } from '../../services/test-loader.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-theme-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownModule, ButtonModule],
  templateUrl: './theme-selector.component.html',
  styleUrls: ['./theme-selector.component.css']
})
export class ThemeSelectorComponent implements OnInit {
  themes: {name: string, file: string}[] = [];
  selectedTheme: {name: string, file: string} | null = null;
  loading = false;

  constructor(
    private loader: TestLoaderService,
    public router: Router  // Изменено с private на public
  ) {}

  ngOnInit(): void {
    this.loadThemes();
    this.createStars();
  }

  private createStars(): void {
    const count = 80;
    for (let i = 0; i < count; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.width = `${Math.random() * 3 + 1}px`;
      star.style.height = star.style.width;
      star.style.setProperty('--duration', `${Math.random() * 8 + 4}s`);
      document.querySelector('.theme-selector')?.appendChild(star);
    }
  }

  loadThemes(): void {
    this.loading = true;
    this.loader.getAvailableThemes().subscribe({
      next: (themes) => {
        this.themes = themes;
        this.loading = false;
      },
      error: () => {
        this.themes = [];
        this.loading = false;
      }
    });
  }

  startTest(): void {
    if (this.selectedTheme?.file) {
      this.router.navigate(['/quiz', this.selectedTheme.file]);
    }
  }
}