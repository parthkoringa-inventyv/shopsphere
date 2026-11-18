import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadChildren: () => import('./features/landing/landing.routes').then((m) => m.LANDING_ROUTES),
  },
  {
    path: 'health',
    loadChildren: () => import('./features/health/health.routes').then((m) => m.HEALTH_ROUTES),
  },
];
