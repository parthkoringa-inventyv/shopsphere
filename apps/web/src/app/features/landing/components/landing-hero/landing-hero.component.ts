import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ScrollStageDirective } from '../../directives/scroll-stage.directive';
import { JOURNEY_FRAMES } from '../../landing.constants';
import { JourneySceneComponent } from '../journey-scene/journey-scene.component';
import { LandingNavComponent } from '../landing-nav/landing-nav.component';

/**
 * The first screen: "From our shelf / to your door" split to the two edges, with the reel of an
 * order's trip running between the halves. The stage holds while the reel advances, one frame per
 * stretch of scroll, then lets go (ScrollStageDirective).
 */
@Component({
  selector: 'app-landing-hero',
  imports: [ScrollStageDirective, JourneySceneComponent, LandingNavComponent],
  templateUrl: './landing-hero.component.html',
  styleUrl: './landing-hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingHeroComponent {
  protected readonly frames = JOURNEY_FRAMES;
}
