import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

/** 'rise' fades the element up with the global styles; 'custom' only marks it for component styles. */
export type RevealMode = 'rise' | 'custom';

/**
 * Plays an element's entrance once, when it first scrolls into view.
 *
 * The hidden state is only applied after an IntersectionObserver is attached (by adding `.reveal`),
 * so where the observer is missing, or the visitor prefers reduced motion, the content simply shows.
 * The observed host is never clipped, since a host clipped to nothing would never report as visible.
 */
@Directive({ selector: '[appReveal]' })
export class RevealDirective {
  readonly appReveal = input<RevealMode | ''>('rise');
  /** Delay before this element's entrance starts, in ms; used to stagger the parts of a section. */
  readonly revealDelay = input(0);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => this.arm());
  }

  private arm(): void {
    if (typeof IntersectionObserver === 'undefined' || typeof matchMedia !== 'function') {
      return;
    }

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const element = this.host.nativeElement;
    element.classList.add('reveal', `reveal--${this.appReveal() || 'rise'}`);
    element.style.setProperty('--reveal-delay', `${this.revealDelay()}ms`);

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        element.classList.add('is-in');
        observer.disconnect();
      }
    });

    observer.observe(element);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }
}
