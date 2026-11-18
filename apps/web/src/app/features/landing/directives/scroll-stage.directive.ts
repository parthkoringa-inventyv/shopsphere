import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

/** Which way the track travels while its stage is held. */
export type StageAxis = 'x' | 'y';

/** A held stage longer than this many screens reads as a stuck page, so it is not held at all. */
const MAX_SCREENS = 3;

/**
 * Holds a section's stage in place while the page scrolls, and moves one track through it.
 *
 * The host becomes `.is-pinned` and as tall as one screen plus the scroll the track needs, so the
 * page's own scrolling moves the track (`stageSpeed` px of travel per px of scroll); the component's
 * styles make the stage sticky in that state. Nothing is hijacked: this only listens to scrolling.
 * Without `matchMedia`, under reduced motion, on screens narrower than `stageMinWidth`, or when the
 * hold would last more than three screens, the host keeps its plain layout with every item in flow.
 */
@Directive({ selector: '[appScrollStage]' })
export class ScrollStageDirective {
  readonly appScrollStage = input<StageAxis | ''>('y');
  /** The element that travels through the held stage. */
  readonly stageTrack = input.required<HTMLElement>();
  /** The narrowest viewport, in px, that holds the stage. */
  readonly stageMinWidth = input(0);
  /** Px the track travels per px scrolled; above 1 shortens the hold. */
  readonly stageSpeed = input(1);
  /** On the y axis, the track's items the travel runs between (the first is in place at the start). */
  readonly stageItem = input(':scope > *');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  private pinned = false;
  private travel = 0;
  private queued = false;

  constructor() {
    afterNextRender(() => this.start());
  }

  private start(): void {
    if (typeof matchMedia !== 'function' || typeof requestAnimationFrame !== 'function') {
      return;
    }

    const motion = matchMedia('(prefers-reduced-motion: no-preference)');
    const measure = (): void => this.measure(motion.matches);
    const onScroll = (): void => {
      if (!this.queued) {
        this.queued = true;
        requestAnimationFrame(() => this.place());
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    motion.addEventListener('change', measure);
    void document.fonts?.ready.then(measure);
    measure();

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      motion.removeEventListener('change', measure);
    });
  }

  private measure(motionAllowed: boolean): void {
    const host = this.host.nativeElement;
    const track = this.stageTrack();

    // Measure the track as it sits when held, then decide whether to hold it.
    host.classList.add('is-pinned');
    host.style.height = '';
    track.style.transform = '';
    this.travel = this.trackTravel(track);

    this.pinned =
      motionAllowed &&
      window.innerWidth >= this.stageMinWidth() &&
      this.travel > 0 &&
      this.holdLength() < window.innerHeight * MAX_SCREENS;

    host.classList.toggle('is-pinned', this.pinned);
    host.style.height = this.pinned
      ? `${Math.round(window.innerHeight + this.holdLength())}px`
      : '';
    this.place();
  }

  /** Px of scroll the hold lasts. */
  private holdLength(): number {
    return this.travel / Math.max(this.stageSpeed(), 0.1);
  }

  private trackTravel(track: HTMLElement): number {
    if (this.appScrollStage() === 'x') {
      return track.scrollWidth - track.clientWidth;
    }

    const items = Array.from(track.querySelectorAll<HTMLElement>(this.stageItem()));
    const first = items.at(0);
    const last = items.at(-1);

    return first && last ? last.offsetTop - first.offsetTop : 0;
  }

  private place(): void {
    this.queued = false;
    const track = this.stageTrack();

    if (!this.pinned) {
      track.style.transform = '';
      return;
    }

    const top = this.host.nativeElement.getBoundingClientRect().top;
    const progress = Math.min(1, Math.max(0, -top / this.holdLength()));
    const offset = (-progress * this.travel).toFixed(1);

    track.style.transform =
      this.appScrollStage() === 'x'
        ? `translate3d(${offset}px, 0, 0)`
        : `translate3d(0, ${offset}px, 0)`;
  }
}
