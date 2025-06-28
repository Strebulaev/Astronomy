import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Test } from '../../models/test.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-theme-selector',
  templateUrl: './theme-selector.component.html',
  styleUrls: ['./theme-selector.component.css'],
  imports: [CommonModule, FormsModule],
})
export class ThemeSelectorComponent implements OnInit {
  tests: Test[] = [];
  tags: any[] = [];
  selectedTest: Test | null = null;
  
  constructor(private dataService: DataService, private router: Router) {}

  ngOnInit(): void {
    this.loadThematicTests();
  }

  loadTags(): void {
    this.dataService.getTags().subscribe((tags: any[]) => {
      this.tags = tags;
    });
  }

  loadThematicTests(): void {
    this.dataService.getThematicTests().subscribe({
      next: (tests) => this.tests = tests,
      error: (err) => console.error('Error loading tests:', err)
    });
  }

  // theme-selector.component.ts
  startTest(): void {
    if (this.selectedTest) {
      console.log('Starting test with:', this.selectedTest); // Для отладки
      this.router.navigate(['quiz'], {
        state: {
          test: this.selectedTest,
          testType: 'thematic'
        }
      }).then(navSuccess => {
        if (!navSuccess) {
          console.error('Navigation failed');
        }
      });
    }
  }
  
}