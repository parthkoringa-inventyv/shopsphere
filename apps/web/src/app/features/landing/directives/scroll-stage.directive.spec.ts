import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ScrollStageDirective } from './scroll-stage.directive';

@Component({
  imports: [ScrollStageDirective],
  template: `
    <section appScrollStage="y" [stageTrack]="track">
      <ol #track>
        <li>One</li>
        <li>Two</li>
      </ol>
    </section>
  `,
})
class StageHostComponent {}

describe('ScrollStageDirective', () => {
  it('should keep the plain layout where the page cannot be measured', async () => {
    await TestBed.configureTestingModule({ imports: [StageHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(StageHostComponent);
    await fixture.whenStable();

    const stage = (fixture.nativeElement as HTMLElement).querySelector('section');

    // jsdom has no matchMedia, so nothing is held and every item stays in normal flow.
    expect(stage?.classList.contains('is-pinned')).toBe(false);
    expect(stage?.style.height).toBe('');
    expect(stage?.querySelectorAll('li').length).toBe(2);
  });
});
