import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from '../../../../environments/environment';
import { SHOW_LOADER } from '../../../core/interceptors/loader.interceptor';
import { ApiSuccessResponse } from '../../../core/models/api-response.model';
import { HealthStatus } from '../models/health.model';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(HealthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should request the liveness endpoint and return the response', () => {
    const envelope: ApiSuccessResponse<HealthStatus> = {
      success: true,
      data: { status: 'ok' },
      meta: null,
    };
    let response: ApiSuccessResponse<HealthStatus> | undefined;

    service.getLiveStatus().subscribe((res) => (response = res));

    const req = httpMock.expectOne(`${environment.apiOrigin}/api/v1/health/live`);
    expect(req.request.method).toBe('GET');
    expect(req.request.context.get(SHOW_LOADER)).toBe(true);
    req.flush(envelope);

    expect(response).toEqual(envelope);
  });

  it('should request the readiness endpoint and return the response', () => {
    const envelope: ApiSuccessResponse<HealthStatus> = {
      success: true,
      data: { status: 'ready' },
      meta: null,
    };
    let response: ApiSuccessResponse<HealthStatus> | undefined;

    service.getReadyStatus().subscribe((res) => (response = res));

    const req = httpMock.expectOne(`${environment.apiOrigin}/api/v1/health/ready`);
    expect(req.request.method).toBe('GET');
    expect(req.request.context.get(SHOW_LOADER)).toBe(true);
    req.flush(envelope);

    expect(response).toEqual(envelope);
  });
});
