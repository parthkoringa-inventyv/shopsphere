import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { RevealDirective } from '../../directives/reveal.directive';
import { ScrollStageDirective } from '../../directives/scroll-stage.directive';
import { HELD_PHOTO, SHOP_STEPS } from '../../landing.constants';
import { StepFragmentComponent } from '../step-fragment/step-fragment.component';

/**
 * "How shopping works": five cards, each a cropped piece of the shop's interface on its own candy
 * colour, crossing a held night-market photograph from right to left as the page scrolls (desktop).
 * Phones and reduced motion get the same cards as a row that swipes sideways.
 */
@Component({
  selector: 'app-shop-steps',
  imports: [NgOptimizedImage, RevealDirective, ScrollStageDirective, StepFragmentComponent],
  templateUrl: './shop-steps.component.html',
  styleUrl: './shop-steps.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopStepsComponent {
  protected readonly steps = SHOP_STEPS;
  protected readonly photo = HELD_PHOTO;
}
