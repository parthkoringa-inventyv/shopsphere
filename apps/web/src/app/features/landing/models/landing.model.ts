/** The candy colours a block on the landing page can sit on; text on every one is near-black. */
export type CandyField = 'mint' | 'cyan' | 'lemon' | 'orange' | 'sky';

/** An in-page link: every landing link points at a section of `/` by its fragment. */
export interface LandingLink {
  label: string;
  fragment: string;
}

export type JourneySceneId = 'shelf' | 'bag' | 'road' | 'door';

/** One frame of the hero reel: a stop on an order's trip from our shelf to your door. */
export interface JourneyFrame {
  id: JourneySceneId;
  caption: string;
  /** What the drawing shows, for screen readers. */
  description: string;
  field: CandyField;
}

export type ShopStepId = 'find' | 'bag' | 'save' | 'checkout' | 'track';

/** One step of shopping, shown as a cropped piece of the shop's interface. */
export interface ShopStep {
  id: ShopStepId;
  name: string;
  description: string;
  /** What the interface fragment shows, for screen readers. */
  fragmentLabel: string;
  field: CandyField;
}

export type WhatIfId = 'last-one' | 'pay-twice' | 'guest' | 'reviews';

/** A shopper's worry and what the shop actually does about it. */
export interface WhatIf {
  id: WhatIfId;
  worry: string;
  answer: string;
  field: CandyField;
}

export interface FaqItem {
  question: string;
  answer: string;
}

/** A picture on the page, with its natural size (the slot is sized so it is not blown up much). */
export interface LandingPhoto {
  src: string;
  alt: string;
  width: number;
  height: number;
}
