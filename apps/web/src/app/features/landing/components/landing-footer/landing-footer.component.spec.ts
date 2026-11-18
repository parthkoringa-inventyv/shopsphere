import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LandingFooterComponent } from './landing-footer.component';

describe('LandingFooterComponent', () => {
  let fixture: ComponentFixture<LandingFooterComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingFooterComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingFooterComponent);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  it('should link to the system status page while the shop is being built', () => {
    const status = Array.from(element.querySelectorAll<HTMLAnchorElement>('a')).find(
      (link) => link.textContent?.trim() === 'System status',
    );

    expect(status?.getAttribute('href')).toBe('/health');
  });

  it('should hold the site links the phone menu jumps to', () => {
    const nav = element.querySelector('#site-links');
    const links = Array.from(nav?.querySelectorAll<HTMLAnchorElement>('a') ?? []);

    expect(nav?.tagName).toBe('NAV');
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/#how',
      '/#what-if',
      '/#questions',
      '/#top',
    ]);
  });

  it('should show the logo with the shop name', () => {
    const logo = element.querySelector('app-logo');

    expect(logo?.querySelector('svg')).not.toBeNull();
    expect(logo?.textContent?.trim()).toBe('ShopSphere');
  });

  it('should say what the shop is in its heading, and make the action one whole tile', () => {
    const action = element.querySelector<HTMLAnchorElement>('.tile--action');

    expect(element.querySelector('h2')?.textContent).toContain('One online shop');
    expect(action?.getAttribute('href')).toBe('/#what-if');
    expect(action?.textContent?.trim()).toBe('Try a what-if');
  });
});
