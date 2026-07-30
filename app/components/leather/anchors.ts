/**
 * In-page anchors for `/lp/leather`.
 *
 * The page's CTAs scroll to the on-page grid rather than navigating to `/shop`:
 * paid traffic that leaves the page has to be re-convinced by a page that was
 * not written for the ad it clicked.
 */
export const LEATHER_HERO_ID = 'leather-hero';
export const LEATHER_COLLECTION_ID = 'collection';
export const LEATHER_COLLECTION_HREF = `#${LEATHER_COLLECTION_ID}`;
export const LEATHER_FINAL_CTA_ID = 'leather-final-cta';

/**
 * Sections that already put a CTA on screen. The sticky bar stands down while
 * any of them is visible — a floating button that scrolls you to a button you
 * can already see is just noise, and at the foot of the page it would sit on
 * top of the copyright line.
 */
export const LEATHER_CTA_SECTION_IDS = [
  LEATHER_COLLECTION_ID,
  LEATHER_FINAL_CTA_ID,
] as const;
