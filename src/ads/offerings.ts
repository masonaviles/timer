// Ads — the self-promo content model. Framework-free. Swap EXAMPLE_OFFERINGS (or supply
// your own array to the AdSlot) with real offerings before launch. No tracking, no cookies.

export interface Offering {
  title: string;
  blurb: string;
  href: string;
  /** Call-to-action label, e.g. "Learn more". */
  cta?: string;
  /** Optional image URL. */
  image?: string;
}

/**
 * Placeholder offerings — REPLACE with your real products/services (A3).
 * Kept generic so the slot renders something meaningful out of the box.
 */
export const EXAMPLE_OFFERINGS: Offering[] = [
  {
    title: 'Work with me 1:1',
    blurb: 'Coaching & facilitation for teams and retreats.',
    href: '#',
    cta: 'Learn more',
  },
  {
    title: 'More free tools',
    blurb: 'Browse the rest of my utilities.',
    href: '/utilities',
    cta: 'Browse',
  },
];
