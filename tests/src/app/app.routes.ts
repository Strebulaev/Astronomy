// app.routes.ts
import { Routes } from '@angular/router';
import { ThemeSelectorComponent } from './components/theme-selector/theme-selector.component';
import { QuizComponent } from './components/quiz/quiz.component';
import { TestCreatorComponent } from './components/test-creator/test-creator.component';
import { HistoryComponent } from './components/history/history.component';
import { DailyTopicsComponent } from './components/daily-topics/daily-topics.component';
import { ProgressChartsComponent } from './components/progress-charts/progress-charts.component';
import { OlympiadPreparationComponent } from './components/olympiad-preparation/olympiad-preparation.component';

export const routes: Routes = [
  { path: '', component: ThemeSelectorComponent },
  { path: 'quiz', component: QuizComponent },
  { path: 'creator', component: TestCreatorComponent },
  { path: 'history', component: HistoryComponent },
  { path: 'daily-topics', component: DailyTopicsComponent},
  { path: 'olympiad-preparation', component: OlympiadPreparationComponent },
  { path: '**', redirectTo: '' }
];