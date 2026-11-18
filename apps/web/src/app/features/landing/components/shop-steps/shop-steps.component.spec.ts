import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SHOP_STEPS } from '../../landing.constants';
import { ShopStepsComponent } from './shop-steps.component';

describe('ShopStepsComponent', () => {
  let fixture: ComponentFixture<ShopStepsComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShopStepsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ShopStepsComponent);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  it('should open with its heading and be the target of the "How it works" links', () => {
    const section = element.querySelector('section');

    expect(section?.id).toBe('how');
    expect(section?.querySelector('h2')?.textContent).toBe('How shopping works');
  });

  it('should show every shopping step in order, each with its own interface fragment', () => {
    const names = Array.from(element.querySelectorAll('.card__name'));
    const fragments = Array.from(element.querySelectorAll('[data-ui]'));

    expect(names.map((name) => name.textContent)).toEqual(SHOP_STEPS.map((step) => step.name));
    expect(fragments.map((fragment) => fragment.getAttribute('aria-label'))).toEqual(
      SHOP_STEPS.map((step) => step.fragmentLabel),
    );
  });

  it('should describe the held photograph', () => {
    expect(element.querySelector('.steps__photo img')?.getAttribute('alt')).toContain(
      'shopping bags',
    );
  });
});
