import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogoComponent } from './logo.component';

describe('LogoComponent', () => {
  let fixture: ComponentFixture<LogoComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LogoComponent);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  it('should draw the mark as one labelled image by default', () => {
    const mark = element.querySelector('svg');

    expect(mark?.getAttribute('role')).toBe('img');
    expect(mark?.getAttribute('aria-label')).toBe('ShopSphere');
    expect(element.querySelector('.logo__word')).toBeNull();
  });

  it('should set the name beside the mark in the lockup, hiding the drawing from screen readers', async () => {
    fixture.componentRef.setInput('variant', 'lockup');
    await fixture.whenStable();

    const mark = element.querySelector('svg');

    expect(element.querySelector('.logo__word')?.textContent).toBe('ShopSphere');
    expect(mark?.getAttribute('aria-hidden')).toBe('true');
    expect(mark?.hasAttribute('role')).toBe(false);
  });
});
