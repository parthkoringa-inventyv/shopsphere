import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { RevealDirective } from '../../directives/reveal.directive';
import { WHAT_IFS } from '../../landing.constants';
import { WhatIfId } from '../../models/landing.model';
import { WhatIfArtComponent } from '../what-if-art/what-if-art.component';

/**
 * The page's live thing: four worries shoppers have, dealt as a fan of cards. Each card's button
 * swaps its drawing for what the shop actually does (the rules in docs/REQUIREMENTS.md), and back.
 * Cards open independently, so several answers can be compared side by side.
 */
@Component({
  selector: 'app-what-if',
  imports: [RevealDirective, WhatIfArtComponent],
  templateUrl: './what-if.component.html',
  styleUrl: './what-if.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhatIfComponent {
  protected readonly items = WHAT_IFS;

  private readonly open = signal<ReadonlySet<WhatIfId>>(new Set());

  protected isOpen(id: WhatIfId): boolean {
    return this.open().has(id);
  }

  protected toggle(id: WhatIfId): void {
    this.open.update((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }
}
