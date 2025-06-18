import { Routes } from '@angular/router';
import { ThemeSelectorComponent } from './components/theme-selector/theme-selector.component';
import { HistoryComponent } from './history/history.component';
import { QuizComponent } from './components/quiz/quiz.component';

export const routes: Routes = [
  { path: '', component: ThemeSelectorComponent },
  { path: 'history', component: HistoryComponent },
  { path: 'quiz/:testFile', component: QuizComponent },
  { path: '**', redirectTo: '' }
];