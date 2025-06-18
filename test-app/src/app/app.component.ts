import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  template: `
    <div class="app-container">
      <h1>Тестирование знаний</h1>
      <router-outlet></router-outlet>
      <div class="navigation-buttons" *ngIf="isBrowser">
        <p-button 
          label="История тестов" 
          icon="pi pi-history"
          (click)="navigateToHistory()"
          styleClass="p-button-text">
        </p-button>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      min-height: 100vh;
    }
    h1 {
      color: #2c3e50;
      text-align: center;
      margin-bottom: 2rem;
    }
    .navigation-buttons {
      display: flex;
      justify-content: center;
      margin-top: 23rem;
    }
  `]
})
export class AppComponent {
  isBrowser: boolean;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  navigateToHistory(): void {
    this.router.navigate(['/history']);
  }
}