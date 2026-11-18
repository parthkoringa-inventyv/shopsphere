import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ShopStepId } from '../../models/landing.model';

/**
 * A cropped piece of the shop's own interface for one shopping step, built in HTML. It is a picture
 * of the interface, not a working control: screen readers get one label describing what it shows.
 * The items, prices and coupon in it are sample content.
 */
@Component({
  selector: 'app-step-fragment',
  templateUrl: './step-fragment.component.html',
  styleUrl: './step-fragment.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepFragmentComponent {
  readonly step = input.required<ShopStepId>();
  readonly label = input.required<string>();

  protected readonly wishlist = ['Linen shirt, sand', 'Cotton kurta, rust', 'Steel bottle, 750 ml'];
}
