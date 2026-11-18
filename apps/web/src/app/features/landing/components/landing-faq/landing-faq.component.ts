import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { RevealDirective } from '../../directives/reveal.directive';
import { FAQ_FACTS, FAQ_ITEMS, FAQ_PHOTOS } from '../../landing.constants';

/** "Before you shop": the practical facts and the questions people ask first, beside two photos. */
@Component({
  selector: 'app-landing-faq',
  imports: [NgOptimizedImage, RouterLink, RevealDirective],
  templateUrl: './landing-faq.component.html',
  styleUrl: './landing-faq.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingFaqComponent {
  protected readonly facts = FAQ_FACTS;
  protected readonly items = FAQ_ITEMS;
  protected readonly photos = FAQ_PHOTOS;
}
