import {
  FaqItem,
  JourneyFrame,
  LandingLink,
  LandingPhoto,
  ShopStep,
  WhatIf,
} from './models/landing.model';

// The landing page's words in one place, as health.constants.ts does for the status page.
// Policy figures marked "sample" are placeholders until the shop's real rules are settled.

export const LANDING_LINKS: readonly LandingLink[] = [
  { label: 'How it works', fragment: 'how' },
  { label: 'What if', fragment: 'what-if' },
  { label: 'Questions', fragment: 'questions' },
];

export const JOURNEY_FRAMES: readonly JourneyFrame[] = [
  {
    id: 'shelf',
    caption: 'On our shelf, counted to the last one.',
    description: 'Three boxes on a shelf with a tag that says 3 left.',
    field: 'lemon',
  },
  {
    id: 'bag',
    caption: 'In your bag, paid for once.',
    description: 'The ShopSphere bag with a rupee coin dropping into it.',
    field: 'mint',
  },
  {
    id: 'road',
    caption: 'Packed by us and on its way.',
    description: 'A taped parcel riding on a delivery scooter along a road.',
    field: 'orange',
  },
  {
    id: 'door',
    caption: 'At your door, with an email at every step.',
    description: 'A parcel waiting on the mat outside a front door.',
    field: 'sky',
  },
];

export const SHOP_STEPS: readonly ShopStep[] = [
  {
    id: 'find',
    name: 'Find it',
    description: 'Search the whole shop, then narrow it by size, colour and price.',
    fragmentLabel:
      'A search for linen shirt, filtered to size M, olive and under ₹2,000, sorted by price.',
    field: 'cyan',
  },
  {
    id: 'bag',
    name: 'Bag it',
    description: 'No account needed to fill a bag. Sign in later and it comes with you.',
    fragmentLabel:
      'A guest bag with a linen shirt and a steel bottle, subtotal ₹1,848, kept on this device until you sign in.',
    field: 'mint',
  },
  {
    id: 'save',
    name: 'Save it',
    description: 'Keep a wishlist for later. One tap moves anything into your bag.',
    fragmentLabel:
      'A wishlist of three things saved to your account, each with a button to move it to the bag.',
    field: 'sky',
  },
  {
    id: 'checkout',
    name: 'Check out',
    description:
      'Choose an address and delivery. The shop works out the total again before you pay.',
    fragmentLabel:
      'Checkout totals: items ₹2,598, coupon WELCOME10 takes off ₹200, free delivery, total ₹2,398.',
    field: 'lemon',
  },
  {
    id: 'track',
    name: 'Track it',
    description:
      "Follow each step in your orders and by email. Cancel any time before it's packed.",
    fragmentLabel:
      'Order SS-10482: placed, paid and packed, shipped today, delivery still to come.',
    field: 'orange',
  },
];

export const WHAT_IFS: readonly WhatIf[] = [
  {
    id: 'last-one',
    worry: 'Two want the last one',
    answer:
      "Whoever reaches payment first has it held for 15 minutes. Everyone else sees it's gone before paying a rupee, so it's never sold twice.",
    field: 'mint',
  },
  {
    id: 'pay-twice',
    worry: 'I tapped Pay twice',
    answer:
      "You're charged once. The second tap finds the same order and stops there, and it only counts as paid when the payment provider confirms it.",
    field: 'lemon',
  },
  {
    id: 'guest',
    worry: 'No account yet?',
    answer:
      'Fill a bag as a guest and it stays on this device. Sign in to order and the bag joins your account, quantities added together.',
    field: 'orange',
  },
  {
    id: 'reviews',
    worry: 'Who can review?',
    answer:
      'Only people who bought the item, once for each purchase. No reviews from strangers, and none from the shop itself.',
    field: 'sky',
  },
];

export const FAQ_FACTS: readonly string[] = [
  'Prices in rupees, with the full total shown before you pay.',
  'Pay through our payment provider; card numbers never reach us.',
  'Order updates by email and on your orders page.',
];

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: 'Do I need an account?',
    answer:
      'Not to browse or fill a bag. You sign in to place an order, and the bag you filled as a guest comes with you.',
  },
  {
    question: 'Is paying safe?',
    answer:
      "You pay on the payment provider's own page. ShopSphere never sees or stores your card number, and an order counts as paid only when the provider confirms it.",
  },
  {
    question: 'Can I cancel an order?',
    answer:
      "Yes, from your orders page, until it's packed. After that, ask for a return once it arrives.",
  },
  {
    question: 'How do returns work?',
    answer:
      'Ask for a return within 7 days of delivery from your orders page. The refund goes back the way you paid once the return reaches us.',
  },
  {
    question: 'How do I track it?',
    answer:
      "Every step from paid to delivered is emailed to you and shown on your orders page, with the courier's updates.",
  },
  {
    question: 'How do coupons work?',
    answer:
      'Each code shows its rules beside it: the smallest order, the most it takes off and the dates it works. One code per order.',
  },
];

// Pictures supplied for the project: staged shopping scenes, not real places. They are small
// (300–630px wide), so each is shown at about its own size or as a darkened backdrop.
export const HELD_PHOTO: LandingPhoto = {
  src: 'images/landing/shopping-flatlay.jpg',
  alt: 'Black shopping bags with red handles, wrapped gifts and two small gold trolleys on a dark table.',
  width: 626,
  height: 417,
};

export const FAQ_PHOTOS: { main: LandingPhoto; small: LandingPhoto } = {
  main: {
    src: 'images/landing/clothing-flatlay.jpg',
    alt: 'Folded shirts, a striped sweater and trousers laid out with festive ornaments on a green table.',
    width: 500,
    height: 317,
  },
  small: {
    src: 'images/landing/cart-parcels.jpg',
    alt: 'A shopping trolley stacked high with cardboard parcels.',
    width: 299,
    height: 168,
  },
};

export const FOOTER_PICTURE: LandingPhoto = {
  src: 'images/landing/online-store.png',
  alt: 'An online shop drawn as a screen with a striped awning, a trolley of parcels and gift boxes.',
  width: 500,
  height: 478,
};
