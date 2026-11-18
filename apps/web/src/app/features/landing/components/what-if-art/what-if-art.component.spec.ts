import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhatIfArtComponent } from './what-if-art.component';

describe('WhatIfArtComponent', () => {
  let fixture: ComponentFixture<WhatIfArtComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhatIfArtComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WhatIfArtComponent);
    fixture.componentRef.setInput('art', 'reviews');
    await fixture.whenStable();
  });

  it('should draw a decorative picture that screen readers skip', () => {
    const drawing = (fixture.nativeElement as HTMLElement).querySelector('svg');

    expect(drawing?.getAttribute('aria-hidden')).toBe('true');
    expect(drawing?.querySelectorAll('path').length).toBeGreaterThan(0);
  });
});
