import { Routes } from '@angular/router';

import { LandingPageComponent } from './components/landing-page/landing-page.component';

export const LANDING_ROUTES: Routes = [
  {
    path: '',
    component: LandingPageComponent,
    title: 'ShopSphere | From our shelf to your door',
  },
];
