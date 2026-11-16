import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';
import { LoaderService } from './core/services/loader.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the router outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });

  it('should show the global loader only while LoaderService is loading', async () => {
    const fixture = TestBed.createComponent(App);
    const loader = TestBed.inject(LoaderService);
    const compiled = fixture.nativeElement as HTMLElement;

    await fixture.whenStable();
    expect(compiled.querySelector('app-loader')).toBeNull();

    loader.show();
    await fixture.whenStable();
    expect(compiled.querySelector('app-loader')).not.toBeNull();

    loader.hide();
    await fixture.whenStable();
    expect(compiled.querySelector('app-loader')).toBeNull();
  });
});
