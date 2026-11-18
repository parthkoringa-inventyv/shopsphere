import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { FAQ_FACTS, FAQ_ITEMS } from '../../landing.constants';
import { LandingFaqComponent } from './landing-faq.component';

describe('LandingFaqComponent', () => {
  let fixture: ComponentFixture<LandingFaqComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingFaqComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingFaqComponent);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  it('should be the "Questions" section, opening with its heading and the practical facts', () => {
    expect(element.querySelector('section')?.id).toBe('questions');
    expect(element.querySelector('h2')?.textContent).toBe('Before you shop');
    expect(element.querySelectorAll('.faq__facts li').length).toBe(FAQ_FACTS.length);
  });

  it('should answer every question in a closed disclosure', () => {
    const items = Array.from(element.querySelectorAll('details'));

    expect(items.map((item) => item.querySelector('summary')?.textContent)).toEqual(
      FAQ_ITEMS.map((item) => item.question),
    );
    expect(items.every((item) => !item.open)).toBe(true);
  });

  it('should describe both photographs', () => {
    const photos = Array.from(element.querySelectorAll('img'));

    expect(photos.length).toBe(2);
    expect(photos.every((photo) => (photo.getAttribute('alt') ?? '').length > 20)).toBe(true);
  });
});
