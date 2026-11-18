import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { PlayInViewDirective } from './play-in-view.directive';

@Component({
  imports: [PlayInViewDirective],
  template: `<div appPlayInView>Loop</div>`,
})
class LoopHostComponent {}

describe('PlayInViewDirective', () => {
  it('should let loops play where there is no IntersectionObserver to pause them', async () => {
    await TestBed.configureTestingModule({ imports: [LoopHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(LoopHostComponent);
    await fixture.whenStable();

    const host = (fixture.nativeElement as HTMLElement).querySelector('div');

    expect(host?.classList.contains('is-playing')).toBe(true);
  });
});
