import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LogoComponent } from '../../../../shared/components/logo/logo.component';
import { FOOTER_PICTURE, LANDING_LINKS } from '../../landing.constants';

/**
 * The close, as the last two rows of a board of tiles on the page's margins: what the shop is, the
 * site links, a picture, the temporary link to the /health status page, the logo in full colour,
 * and the one action as a tile of its own.
 */
@Component({
  selector: 'app-landing-footer',
  imports: [NgOptimizedImage, RouterLink, LogoComponent],
  templateUrl: './landing-footer.component.html',
  styleUrl: './landing-footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingFooterComponent {
  protected readonly links = LANDING_LINKS;
  protected readonly picture = FOOTER_PICTURE;
}
