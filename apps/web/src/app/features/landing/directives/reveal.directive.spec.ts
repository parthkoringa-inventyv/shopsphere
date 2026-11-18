import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { RevealDirective } from './reveal.directive';

@Component({
  imports: [RevealDirective],
  template: `<h2 appReveal [revealDelay]="80">Shown</h2>`,
})
class RevealHostComponent {}

describe('RevealDirective', () => {
  it('should leave content visible where there is no IntersectionObserver', async () => {
    await TestBed.configureTestingModule({ imports: [RevealHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(RevealHostComponent);
    await fixture.whenStable();

    const heading = (fixture.nativeElement as HTMLElement).querySelector('h2');

    // jsdom has no IntersectionObserver, so the hidden starting state is never applied.
    expect(heading?.classList.contains('reveal')).toBe(false);
    expect(heading?.textContent).toBe('Shown');
  });
});
