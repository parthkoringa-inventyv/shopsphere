import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ApiError } from '../../../../core/models/api-error.model';
import { HealthService } from '../../services/health.service';

type OverallStatus = 'operational' | 'degraded' | 'offline';

interface HealthCheck {
  state: 'up' | 'down';
  message: string;
  code: string | null;
  requestId: string | null;
}

@Component({
  selector: 'app-health-status',
  imports: [DatePipe],
  templateUrl: './health-status.component.html',
  styleUrl: './health-status.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HealthStatusComponent implements OnInit {
  private readonly healthService = inject(HealthService);
  private readonly destroyRef = inject(DestroyRef);

  // null until a response arrives; the global loader covers the wait.
  protected readonly live = signal<HealthCheck | null>(null);
  protected readonly ready = signal<HealthCheck | null>(null);
  protected readonly lastCheckedAt = signal<Date | null>(null);

  protected readonly overall = computed<OverallStatus | null>(() => {
    const live = this.live();
    const ready = this.ready();

    if (!live || !ready) {
      return null;
    }

    if (live.state === 'down') {
      return 'offline';
    }

    return ready.state === 'up' ? 'operational' : 'degraded';
  });

  protected readonly checks = computed(() => [
    {
      id: 'live',
      title: 'API server',
      description: 'Liveness: is the API process running?',
      check: this.live(),
    },
    {
      id: 'ready',
      title: 'PostgreSQL + Redis',
      description: 'Readiness: are the database and cache reachable?',
      check: this.ready(),
    },
  ]);

  ngOnInit(): void {
    this.checkHealth();
  }

  protected checkHealth(): void {
    this.live.set(null);
    this.ready.set(null);
    this.lastCheckedAt.set(new Date());

    this.healthService
      .getLiveStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ data }) =>
          this.live.set({
            state: 'up',
            message: `API process is running (status: ${data.status}).`,
            code: null,
            requestId: null,
          }),
        error: (error: ApiError) => this.live.set(toDownState(error)),
      });

    this.healthService
      .getReadyStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ data }) =>
          this.ready.set({
            state: 'up',
            message: `PostgreSQL and Redis are reachable (status: ${data.status}).`,
            code: null,
            requestId: null,
          }),
        error: (error: ApiError) => this.ready.set(toDownState(error)),
      });
  }
}

// Errors arrive normalized by errorInterceptor; this page only decides how to word them.
function toDownState(error: ApiError): HealthCheck {
  switch (error.kind) {
    case 'network':
      return {
        state: 'down',
        message: 'Cannot reach the API. It may be stopped, starting up, or blocked by CORS.',
        code: null,
        requestId: null,
      };
    case 'timeout':
      return {
        state: 'down',
        message: 'The API did not respond in time. It may be starting up.',
        code: null,
        requestId: null,
      };
    default:
      return {
        state: 'down',
        message: error.message,
        code: error.code,
        requestId: error.requestId,
      };
  }
}
