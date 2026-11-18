import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { PlayInViewDirective } from '../../directives/play-in-view.directive';
import { JourneySceneId } from '../../models/landing.model';

/**
 * One drawn stop on an order's trip, in flat shapes on the frame's candy field. Each drawing has a
 * small loop (a swinging tag, a coin dropping in, wheels turning, a tick popping up) that plays only
 * while it is on screen. The drawing is 16:9 and keeps its subject in the middle three quarters, so
 * the phone's 4:3 frame can crop its sides.
 */
@Component({
  selector: 'app-journey-scene',
  templateUrl: './journey-scene.component.html',
  styleUrl: './journey-scene.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [PlayInViewDirective],
})
export class JourneySceneComponent {
  readonly scene = input.required<JourneySceneId>();
  readonly description = input.required<string>();

  /** Left edges of the road's dashes; one dash beyond each side so the loop never shows a gap. */
  protected readonly dashes = [-96, 0, 96, 192, 288, 384, 480, 576, 672];
}
