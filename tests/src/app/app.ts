import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  template: `
    <header>
      <h1>Астрономия</h1>
      <nav>
        <ul>
          <li><a routerLink="/" routerLinkActive="active">Выбор теста</a></li>
          <li><a routerLink="/creator" routerLinkActive="active">Генератор тестов</a></li>
          <li><a routerLink="/history" routerLinkActive="active">История</a></li>
          <li><a routerLink="/daily-topics" routerLinkActive="active">План</a></li>
        </ul>
      </nav>
    </header>
    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styleUrls: ['./app.css'],
  imports: [RouterModule],
  standalone: true
})
export class App {}