import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { PlayInViewDirective } from '../../directives/play-in-view.directive';
import { WhatIfId } from '../../models/landing.model';

/** The small drawing on a "What if" card, in near-black on the card's candy colour. Decorative. */
@Component({
  selector: 'app-what-if-art',
  templateUrl: './what-if-art.component.html',
  styleUrl: './what-if-art.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [PlayInViewDirective],
})
export class WhatIfArtComponent {
  readonly art = input.required<WhatIfId>();
}
