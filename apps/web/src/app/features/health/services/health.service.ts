import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiSuccessResponse } from '../../../core/models/api-response.model';
import { ApiClientService } from '../../../core/services/api-client.service';
import { HEALTH_API_PATHS } from '../health.constants';
import { HealthStatus } from '../models/health.model';

@Injectable({
  providedIn: 'root',
})
export class HealthService {
  private readonly apiClient = inject(ApiClientService);

  /** Reports whether the API process is running. */
  getLiveStatus(): Observable<ApiSuccessResponse<HealthStatus>> {
    return this.apiClient.get<HealthStatus>(HEALTH_API_PATHS.LIVE, { showLoader: true });
  }

  /** Reports whether PostgreSQL and Redis are reachable; errors with HTTP 503 when not. */
  getReadyStatus(): Observable<ApiSuccessResponse<HealthStatus>> {
    return this.apiClient.get<HealthStatus>(HEALTH_API_PATHS.READY, { showLoader: true });
  }
}
