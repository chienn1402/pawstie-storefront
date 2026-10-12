/**
 * Data shaping for the home hero's product story.
 *
 * Deliberately free of runtime imports and of the `~/` alias — like
 * `i18n.ts` — so `scripts/hero-slides.test.mjs` can load it through Node's
 * native type stripping and exercise the real functions. Keep it that way.
 *
 * Everything here derives from live Storefront data, so the hero keeps working
 * as the catalogue changes: no handles, no hardcoded prices, no invented
 * discounts. A product the map below doesn't recognise still gets a slide; it
 * just reads "Every day, upgraded."
 */

type Money = {amount: string; currencyCode: string};

type HeroImage = {
  id?: string | null;
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

/**
 * Generic over the money and image shapes so the component gets Storefront's
 * own types (`CurrencyCode`, not `string`) back out, without this file having
 * to import them.
 */
export type HeroProductInput<
  TMoney extends Money = Money,
  TImage extends HeroImage = HeroImage,
> = {
  id: string;
  title: string;
  handle: string;
  featuredImage?: TImage | null;
  selectedOrFirstAvailableVariant?: {
    availableForSale: boolean;
    price: TMoney;
    compareAtPrice?: TMoney | null;
  } | null;
};

export type HeroSlide<
  TMoney extends Money = Money,
  TImage extends HeroImage = HeroImage,
> = {
  id: string;
  title: string;
  handle: string;
  image: TImage;
  price: TMoney;
  /** Only set when it is genuinely higher than `price`. */
  compareAtPrice: TMoney | null;
  /** Whole percent off, 0 when there is no real saving. */
  percentOff: number;
  /** The routine this product upgrades — the headline's rotating word. */
  routine: string;
};

/** Shown when a product matches none of the routines below. */
export const FALLBACK_ROUTINE = 'Every day';

/**
 * Title keyword → routine. First match wins, so the more specific travel and
 * sleep words sit above the generic walk words ("Car Safety Belt" must not
 * read as a walk). Every label is short enough to hold one line of the
 * mobile headline — the longest, "Road trips" / "Snack time", is the budget.
 */
const ROUTINES: ReadonlyArray<readonly [RegExp, string]> = [
  [/\b(car|travel|seat ?belt|tether|carrier)\b/i, 'Road trips'],
  [/\b(beds?|cushions?|blankets?|mats?)\b/i, 'Naps'],
  [/\b(brush(es)?|groom\w*|shed\w*|combs?|nail)\b/i, 'Grooming'],
  [/\b(collars?|leash(es)?|harness(es)?|leads?)\b/i, 'Walks'],
  [/\b(toys?|balls?|chews?|squeak\w*)\b/i, 'Playtime'],
  [/\b(bowls?|feeders?|fountains?)\b/i, 'Mealtime'],
  [/\b(treats?|snacks?)\b/i, 'Snack time'],
];

export function routineFor(title: string): string {
  for (const [pattern, label] of ROUTINES) {
    if (pattern.test(title)) return label;
  }
  return FALLBACK_ROUTINE;
}

/**
 * Whole percent saved against the compare-at price, rounded down so the badge
 * never claims a point more than the shopper actually saves.
 */
export function percentOff(price: Money, compareAtPrice?: Money | null) {
  if (!compareAtPrice) return 0;
  const now = Number(price.amount);
  const was = Number(compareAtPrice.amount);
  if (!(was > now) || !(now >= 0)) return 0;
  return Math.floor(((was - now) / was) * 100);
}

/**
 * Turns Storefront products into hero slides.
 *
 * Drops anything without a photo or that can't be bought right now — a paid
 * click must not land on a sold-out story card. Then interleaves by routine,
 * keeping the incoming (best-selling) order within each routine, so the
 * headline actually rotates instead of reading "Walks" for four slides in a
 * row because the shop sells four collars.
 */
export function toHeroSlides<TMoney extends Money, TImage extends HeroImage>(
  products: ReadonlyArray<HeroProductInput<TMoney, TImage>>,
  limit = 7,
): HeroSlide<TMoney, TImage>[] {
  const groups = new Map<string, HeroSlide<TMoney, TImage>[]>();

  for (const product of products) {
    const variant = product.selectedOrFirstAvailableVariant;
    const image = product.featuredImage;
    if (!variant?.availableForSale || !image?.url) continue;

    const off = percentOff(variant.price, variant.compareAtPrice);
    const routine = routineFor(product.title);
    const slide: HeroSlide<TMoney, TImage> = {
      id: product.id,
      title: product.title,
      handle: product.handle,
      image,
      price: variant.price,
      compareAtPrice: off > 0 ? (variant.compareAtPrice ?? null) : null,
      percentOff: off,
      routine,
    };

    const group = groups.get(routine);
    if (group) group.push(slide);
    else groups.set(routine, [slide]);
  }

  const queues = [...groups.values()];
  const slides: HeroSlide<TMoney, TImage>[] = [];
  while (slides.length < limit && queues.some((queue) => queue.length)) {
    for (const queue of queues) {
      const next = queue.shift();
      if (next && slides.length < limit) slides.push(next);
    }
  }
  return slides;
}

/**
 * Puts an ad's own product at the front of the story. Paid social links to
 * `/?hero=<handle>`, so whoever tapped an ad for one product lands on that
 * product first instead of waiting for the rotation to reach it. The featured
 * product also counts as the first of its routine, so it leads the headline.
 */
export function withFeaturedFirst<T extends {id: string}>(
  featured: T | null | undefined,
  products: ReadonlyArray<T>,
): T[] {
  if (!featured) return [...products];
  return [featured, ...products.filter((product) => product.id !== featured.id)];
}

/** The biggest real saving across the slides — drives "Up to N% off". */
export function maxPercentOff(slides: ReadonlyArray<{percentOff: number}>) {
  return slides.reduce((max, slide) => Math.max(max, slide.percentOff), 0);
}

/**
 * The screen-reader headline. The visible one swaps a word every few seconds,
 * which would be noise read aloud, so assistive tech gets every routine at
 * once: "Walks, naps and grooming, upgraded."
 */
export function routinesSentence(slides: ReadonlyArray<{routine: string}>) {
  const words = [...new Set(slides.map((slide) => slide.routine))].map(
    (word, i) => (i === 0 ? word : word.toLowerCase()),
  );
  if (words.length === 0) return `${FALLBACK_ROUTINE}, upgraded.`;
  if (words.length === 1) return `${words[0]}, upgraded.`;
  const last = words.pop();
  return `${words.join(', ')} and ${last}, upgraded.`;
}
