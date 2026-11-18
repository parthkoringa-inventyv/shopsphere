import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LandingNavComponent } from './landing-nav.component';

describe('LandingNavComponent', () => {
  let fixture: ComponentFixture<LandingNavComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingNavComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingNavComponent);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  it('should link to the three sections of the page', () => {
    const links = Array.from(element.querySelectorAll<HTMLAnchorElement>('.nav__links a'));

    expect(links.map((link) => link.textContent?.trim())).toEqual([
      'How it works',
      'What if',
      'Questions',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/#how',
      '/#what-if',
      '/#questions',
    ]);
  });

  it('should offer the one action as a button-styled link to the what-if cards', () => {
    const action = element.querySelector<HTMLAnchorElement>('a.button');

    expect(action?.textContent?.trim()).toBe('Try a what-if');
    expect(action?.getAttribute('href')).toBe('/#what-if');
  });

  it('should name the home link by the logo', () => {
    const home = element.querySelector<HTMLAnchorElement>('.nav__home');

    expect(home?.textContent?.trim()).toBe('ShopSphere');
    expect(home?.getAttribute('href')).toBe('/#top');
  });
});
