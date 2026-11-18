import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { NEVER } from 'rxjs';

import { routes } from './app.routes';
import { HealthStatusComponent } from './features/health/components/health-status/health-status.component';
import { HealthService } from './features/health/services/health.service';
import { LandingPageComponent } from './features/landing/components/landing-page/landing-page.component';

describe('app routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        // The status page checks the API on init; keep those requests pending in tests.
        {
          provide: HealthService,
          useValue: { getLiveStatus: () => NEVER, getReadyStatus: () => NEVER },
        },
      ],
    });
  });

  it('should show the landing page at the root path', async () => {
    const harness = await RouterTestingHarness.create();

    const page = await harness.navigateByUrl('/', LandingPageComponent);

    expect(page).toBeInstanceOf(LandingPageComponent);
  });

  it('should show the system status page at /health instead of the root', async () => {
    const harness = await RouterTestingHarness.create();

    const page = await harness.navigateByUrl('/health', HealthStatusComponent);

    expect(page).toBeInstanceOf(HealthStatusComponent);
  });
});
