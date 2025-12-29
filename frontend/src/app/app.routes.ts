import { Routes } from '@angular/router';
import { SaveEntryComponent } from './components/save-entry/save-entry.component';
import { MonthlyInsightsComponent } from './components/monthly-insights/monthly-insights.component';

export const routes: Routes = [
  { path: '', redirectTo: '/save-entry', pathMatch: 'full' },
  { path: 'save-entry', component: SaveEntryComponent },
  { path: 'monthly-insights', component: MonthlyInsightsComponent }
];

