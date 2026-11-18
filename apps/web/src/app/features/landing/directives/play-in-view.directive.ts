import { DestroyRef, Directive, ElementRef, afterNextRender, inject, signal } from '@angular/core';

/**
 * Marks its host `.is-playing` while it is on screen, so looping drawings pause when out of sight.
 * Without an IntersectionObserver the loops just play.
 */
@Directive({
  selector: '[appPlayInView]',
  host: { '[class.is-playing]': 'playing()' },
})
export class PlayInViewDirective {
  protected readonly playing = signal(false);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => this.watch());
  }

  private watch(): void {
    if (typeof IntersectionObserver === 'undefined') {
      this.playing.set(true);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      this.playing.set(entry?.isIntersecting ?? false);
    });

    observer.observe(this.host.nativeElement);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }
}
