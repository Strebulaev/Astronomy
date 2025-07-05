import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  template: `
    <header class="app-header">
      <div class="container">
        <div class="header-content">
          <h1>AstroTests</h1>
          <nav class="main-nav">
            <ul>
              <li><a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Главная</a></li>
              <li><a routerLink="/creator" routerLinkActive="active">Генератор</a></li>
              <li><a routerLink="/history" routerLinkActive="active">История</a></li>
              <li><a routerLink="/daily-topics" routerLinkActive="active">План</a></li>
              <!-- <li><a routerLink="/progress" routerLinkActive="active">График</a></li> -->
            </ul>
          </nav>
        </div>
      </div>
    </header>

    <main class="app-main">
      <div class="container">
        <router-outlet></router-outlet>
      </div>
    </main>
  `,
  styleUrls: ['./app.css'],
  imports: [RouterModule, CommonModule],
  standalone: true
})
export class App {}