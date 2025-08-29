import { Routes } from '@angular/router';
import { ThemeSelectorComponent } from './components/theme-selector/theme-selector.component';
import { QuizComponent } from './components/quiz/quiz.component';
import { TestCreatorComponent } from './components/test-creator/test-creator.component';
import { HistoryComponent } from './components/history/history.component';
import { DailyTopicsComponent } from './components/daily-topics/daily-topics.component';
import { OlympiadPreparationComponent } from './components/olympiad-preparation/olympiad-preparation.component';
import { SubjectManagerComponent } from './components/subject-manager/subject-manager.component';

export const routes: Routes = [
  { path: '', component: ThemeSelectorComponent },
  { path: 'quiz', component: QuizComponent },
  { path: 'creator', component: TestCreatorComponent },
  { path: 'history', component: HistoryComponent },
  { path: 'daily-topics', component: DailyTopicsComponent },
  { path: 'olympiad-preparation', component: OlympiadPreparationComponent },
  { path: 'subjects', component: SubjectManagerComponent },
  { path: '**', redirectTo: '' }
];