import { Injectable, computed, signal } from '@angular/core';

/**
 * Global loading state. Counts in-flight work so the loader stays visible
 * until every concurrent request that asked for it has finished.
 */
@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  private readonly activeCount = signal(0);

  readonly isLoading = computed(() => this.activeCount() > 0);

  show(): void {
    this.activeCount.update((count) => count + 1);
  }

  hide(): void {
    this.activeCount.update((count) => Math.max(0, count - 1));
  }
}
