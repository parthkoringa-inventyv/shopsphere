import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LogoComponent } from '../../../../shared/components/logo/logo.component';
import { LANDING_LINKS } from '../../landing.constants';

/** The plain bar: the logo, three links to the page's sections and the one action. */
@Component({
  selector: 'app-landing-nav',
  imports: [RouterLink, LogoComponent],
  templateUrl: './landing-nav.component.html',
  styleUrl: './landing-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingNavComponent {
  protected readonly links = LANDING_LINKS;
}
