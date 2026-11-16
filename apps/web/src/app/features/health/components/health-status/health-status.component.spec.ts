import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NEVER, Observable, of, throwError } from 'rxjs';

import { ApiError } from '../../../../core/models/api-error.model';
import { ApiSuccessResponse } from '../../../../core/models/api-response.model';
import { HealthStatus } from '../../models/health.model';
import { HealthService } from '../../services/health.service';
import { HealthStatusComponent } from './health-status.component';

type HealthResult = Observable<ApiSuccessResponse<HealthStatus>>;

const liveUp = (): HealthResult => of({ success: true, data: { status: 'ok' }, meta: null });
const readyUp = (): HealthResult => of({ success: true, data: { status: 'ready' }, meta: null });
const fail = (error: ApiError) => (): HealthResult => throwError(() => error);

// HealthService errors arrive already normalized by errorInterceptor.
const dependenciesUnavailable = new ApiError({
  kind: 'server',
  status: 503,
  code: 'SERVICE_UNAVAILABLE',
  message: 'One or more required dependencies are unavailable.',
  requestId: 'req-123',
});

const apiUnreachable = new ApiError({
  kind: 'network',
  status: 0,
  code: 'NETWORK_ERROR',
  message: 'Unable to reach the server.',
});

const apiTimedOut = new ApiError({
  kind: 'timeout',
  status: 0,
  code: 'TIMEOUT',
  message: 'The server took too long to respond.',
});

describe('HealthStatusComponent', () => {
  let fixture: ComponentFixture<HealthStatusComponent>;
  let healthService: {
    getLiveStatus: ReturnType<typeof vi.fn<() => HealthResult>>;
    getReadyStatus: ReturnType<typeof vi.fn<() => HealthResult>>;
  };

  async function render(live: () => HealthResult, ready: () => HealthResult): Promise<HTMLElement> {
    healthService = {
      getLiveStatus: vi.fn(live),
      getReadyStatus: vi.fn(ready),
    };

    await TestBed.configureTestingModule({
      imports: [HealthStatusComponent],
      providers: [{ provide: HealthService, useValue: healthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(HealthStatusComponent);
    await fixture.whenStable();

    return fixture.nativeElement as HTMLElement;
  }

  function overallText(element: HTMLElement): string {
    return element.querySelector('[role="status"]')?.textContent?.trim() ?? '';
  }

  function cardText(element: HTMLElement, index: number): string {
    return element.querySelectorAll('article')[index]?.textContent ?? '';
  }

  it('should check liveness and readiness on init', async () => {
    await render(liveUp, readyUp);

    expect(healthService.getLiveStatus).toHaveBeenCalledOnce();
    expect(healthService.getReadyStatus).toHaveBeenCalledOnce();
  });

  it('should leave loading feedback to the global loader while checks are pending', async () => {
    const element = await render(
      () => NEVER,
      () => NEVER,
    );

    expect(element.querySelector('[role="status"]')).toBeNull();
    expect(element.querySelector('.check__badge')).toBeNull();
    expect(element.querySelector('button')?.textContent?.trim()).toBe('Check again');
  });

  it('should report all systems operational when both checks pass', async () => {
    const element = await render(liveUp, readyUp);

    expect(overallText(element)).toBe('All systems operational');
    expect(cardText(element, 0)).toContain('Up');
    expect(cardText(element, 1)).toContain('Up');
  });

  it('should report degraded status with the backend message when readiness returns 503', async () => {
    const element = await render(liveUp, fail(dependenciesUnavailable));

    expect(overallText(element)).toBe('API is running, but PostgreSQL or Redis is unavailable');
    expect(cardText(element, 1)).toContain('Down');
    expect(cardText(element, 1)).toContain('One or more required dependencies are unavailable.');
    expect(cardText(element, 1)).toContain('SERVICE_UNAVAILABLE');
    expect(cardText(element, 1)).toContain('req-123');
  });

  it('should report the API as unreachable on a network error', async () => {
    const element = await render(fail(apiUnreachable), fail(apiUnreachable));

    expect(overallText(element)).toBe('API is unreachable');
    expect(cardText(element, 0)).toContain('Cannot reach the API');
    expect(cardText(element, 0)).not.toContain('NETWORK_ERROR');
  });

  it('should explain a timeout in health-specific terms', async () => {
    const element = await render(fail(apiTimedOut), fail(apiTimedOut));

    expect(overallText(element)).toBe('API is unreachable');
    expect(cardText(element, 0)).toContain('The API did not respond in time');
  });

  it('should run both checks again when "Check again" is clicked', async () => {
    const element = await render(liveUp, readyUp);

    element.querySelector<HTMLButtonElement>('button')?.click();
    await fixture.whenStable();

    expect(healthService.getLiveStatus).toHaveBeenCalledTimes(2);
    expect(healthService.getReadyStatus).toHaveBeenCalledTimes(2);
  });
});
