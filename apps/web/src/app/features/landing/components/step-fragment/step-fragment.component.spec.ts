import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepFragmentComponent } from './step-fragment.component';

describe('StepFragmentComponent', () => {
  let fixture: ComponentFixture<StepFragmentComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepFragmentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StepFragmentComponent);
    element = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('step', 'checkout');
    fixture.componentRef.setInput('label', 'Checkout totals');
    await fixture.whenStable();
  });

  it('should be one labelled picture of the interface, not working controls', () => {
    const fragment = element.querySelector('[data-ui]');

    expect(fragment?.getAttribute('role')).toBe('img');
    expect(fragment?.getAttribute('aria-label')).toBe('Checkout totals');
    expect(element.querySelector('button, input, a')).toBeNull();
  });

  it('should show the total the shop works out again', () => {
    expect(element.textContent).toContain('₹2,398');
    expect(element.textContent).toContain('Worked out again by the shop');
  });
});
