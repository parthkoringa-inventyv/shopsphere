import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** 'mark' is the sphere bag alone; 'lockup' sets the name beside it. */
export type LogoVariant = 'mark' | 'lockup';

/**
 * The ShopSphere logo: the sphere bag (a shopping bag carrying a globe crossed by two ovals), drawn
 * inline so its colours follow the page. It matches public/shopsphere-mark.svg; every colour can be
 * overridden with the --logo-* custom properties.
 */
@Component({
  selector: 'app-logo',
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent {
  readonly variant = input<LogoVariant>('mark');
  readonly label = input('ShopSphere');
}
