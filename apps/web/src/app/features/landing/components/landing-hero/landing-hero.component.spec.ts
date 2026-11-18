import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { JOURNEY_FRAMES } from '../../landing.constants';
import { LandingHeroComponent } from './landing-hero.component';

describe('LandingHeroComponent', () => {
  let fixture: ComponentFixture<LandingHeroComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingHeroComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingHeroComponent);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  it('should carry the page title in one h1, split into its two halves', () => {
    const titles = element.querySelectorAll('h1');

    expect(titles.length).toBe(1);
    expect(titles[0].textContent?.replace(/\s+/g, ' ').trim()).toBe('From our shelf to your door');
  });

  it('should say what ShopSphere is right under the title', () => {
    expect(element.querySelector('.hero__lede')?.textContent).toContain(
      'ShopSphere is one online shop',
    );
  });

  it('should show every stop of the trip, in order, with its caption', () => {
    const captions = Array.from(element.querySelectorAll('.hero__item figcaption'));

    expect(captions.map((caption) => caption.textContent?.trim())).toEqual(
      JOURNEY_FRAMES.map((frame) => frame.caption),
    );
  });

  it('should hide the decorative frame above the reel from screen readers', () => {
    expect(element.querySelector('.hero__ghost')?.getAttribute('aria-hidden')).toBe('true');
  });
});
