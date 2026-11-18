import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WHAT_IFS } from '../../landing.constants';
import { WhatIfComponent } from './what-if.component';

describe('WhatIfComponent', () => {
  let fixture: ComponentFixture<WhatIfComponent>;
  let element: HTMLElement;

  const toggles = (): HTMLButtonElement[] =>
    Array.from(element.querySelectorAll<HTMLButtonElement>('.card__toggle'));
  const cards = (): HTMLElement[] => Array.from(element.querySelectorAll<HTMLElement>('.card'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhatIfComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WhatIfComponent);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  it('should deal one card per worry, every answer closed', () => {
    expect(cards().map((card) => card.querySelector('h3')?.textContent)).toEqual(
      WHAT_IFS.map((item) => item.worry),
    );
    expect(toggles().every((toggle) => toggle.getAttribute('aria-expanded') === 'false')).toBe(
      true,
    );
  });

  it('should give every control a name and tie it to its worry and its answer', () => {
    for (const [index, toggle] of toggles().entries()) {
      const id = WHAT_IFS[index].id;

      expect(toggle.type).toBe('button');
      expect(toggle.textContent?.trim()).toBe('What happens?');
      expect(toggle.getAttribute('aria-describedby')).toBe(`worry-${id}`);
      expect(toggle.getAttribute('aria-controls')).toBe(`answer-${id}`);
      expect(element.querySelector(`#answer-${id}`)?.textContent).toBe(WHAT_IFS[index].answer);
    }
  });

  it('should open a card to its answer and close it again', async () => {
    const [first] = toggles();

    first.click();
    await fixture.whenStable();

    expect(first.getAttribute('aria-expanded')).toBe('true');
    expect(first.textContent?.trim()).toBe('Hide the answer');
    expect(cards()[0].classList.contains('is-open')).toBe(true);

    first.click();
    await fixture.whenStable();

    expect(first.getAttribute('aria-expanded')).toBe('false');
    expect(cards()[0].classList.contains('is-open')).toBe(false);
  });

  it('should let several cards stay open side by side', async () => {
    const [first, second] = toggles();

    first.click();
    second.click();
    await fixture.whenStable();

    expect(cards().filter((card) => card.classList.contains('is-open')).length).toBe(2);
  });
});
