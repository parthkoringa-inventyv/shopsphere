import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JourneySceneId } from '../../models/landing.model';
import { JourneySceneComponent } from './journey-scene.component';

describe('JourneySceneComponent', () => {
  let fixture: ComponentFixture<JourneySceneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JourneySceneComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(JourneySceneComponent);
  });

  const scenes: JourneySceneId[] = ['shelf', 'bag', 'road', 'door'];

  for (const scene of scenes) {
    it(`should draw the ${scene} scene as one described image`, async () => {
      fixture.componentRef.setInput('scene', scene);
      fixture.componentRef.setInput('description', `The ${scene}`);
      await fixture.whenStable();

      const drawing = (fixture.nativeElement as HTMLElement).querySelector('svg');

      expect(drawing?.getAttribute('role')).toBe('img');
      expect(drawing?.getAttribute('aria-label')).toBe(`The ${scene}`);
      expect(drawing?.querySelectorAll('rect, circle, path, polygon').length).toBeGreaterThan(3);
    });
  }
});
