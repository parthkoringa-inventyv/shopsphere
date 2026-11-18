import { ChangeDetectionStrategy, Component } from '@angular/core';

import { LandingFaqComponent } from '../landing-faq/landing-faq.component';
import { LandingFooterComponent } from '../landing-footer/landing-footer.component';
import { LandingHeroComponent } from '../landing-hero/landing-hero.component';
import { ShopStepsComponent } from '../shop-steps/shop-steps.component';
import { WhatIfComponent } from '../what-if/what-if.component';

/**
 * The landing page at `/`: an overview of how shopping at ShopSphere works, from our shelf to your
 * door. It owns the page's dark ground; each section is its own component.
 */
@Component({
  selector: 'app-landing-page',
  imports: [
    LandingHeroComponent,
    ShopStepsComponent,
    WhatIfComponent,
    LandingFaqComponent,
    LandingFooterComponent,
  ],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageComponent {}
