import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LandingPageComponent } from './landing-page.component';

describe('LandingPageComponent', () => {
  let fixture: ComponentFixture<LandingPageComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingPageComponent);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  it('should have exactly one h1', () => {
    expect(element.querySelectorAll('h1').length).toBe(1);
  });

  it('should open every section with a heading', () => {
    const sections = Array.from(element.querySelectorAll('section, footer'));

    expect(sections.length).toBe(4);
    expect(sections.every((section) => section.querySelector('h2') !== null)).toBe(true);
  });

  it('should have a target for every in-page link', () => {
    for (const id of ['top', 'how', 'what-if', 'questions', 'site-links']) {
      expect(element.querySelector(`#${id}`)).not.toBeNull();
    }
  });

  it('should put the sections in a main landmark between the header and the footer', () => {
    expect(element.querySelector('header h1')).not.toBeNull();
    expect(element.querySelectorAll('main section').length).toBe(3);
    expect(element.querySelector('footer')).not.toBeNull();
  });
});
