import { Routes } from '@angular/router';

import { HealthStatusComponent } from './components/health-status/health-status.component';

export const HEALTH_ROUTES: Routes = [
  {
    path: '',
    component: HealthStatusComponent,
    title: 'System status | ShopSphere',
  },
];
