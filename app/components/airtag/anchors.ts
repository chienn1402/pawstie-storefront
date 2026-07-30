/**
 * In-page anchors for `/lp/airtag-collar`.
 *
 * Unlike the leather collection page, the CTAs here end at the product page
 * rather than an on-page grid: the collar has nine variants across three
 * colours and three sizes, and the PDP already handles that choice. Rebuilding
 * variant selection on a landing page is how the two drift apart.
 *
 * The colour-and-size section still gets an id, because it is where the page's
 * own "choose one" CTA lives and the sticky bar has to stand down over it.
 */
export const AIRTAG_HERO_ID = 'airtag-hero';
export const AIRTAG_CHOOSER_ID = 'airtag-chooser';
export const AIRTAG_CHOOSER_HREF = `#${AIRTAG_CHOOSER_ID}`;
export const AIRTAG_FINAL_CTA_ID = 'airtag-final-cta';

/** Sections that already put a CTA on screen; the sticky bar hides over these. */
export const AIRTAG_CTA_SECTION_IDS = [
  AIRTAG_CHOOSER_ID,
  AIRTAG_FINAL_CTA_ID,
] as const;
