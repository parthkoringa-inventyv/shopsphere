import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoaderComponent } from './loader.component';

describe('LoaderComponent', () => {
  let fixture: ComponentFixture<LoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoaderComponent);
    await fixture.whenStable();
  });

  it('should render an accessible loading status', () => {
    const status = (fixture.nativeElement as HTMLElement).querySelector('[role="status"]');

    expect(status?.textContent).toContain('Loading');
  });
});
