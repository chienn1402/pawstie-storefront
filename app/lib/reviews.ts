/**
 * Data shaping for product reviews, which come from Judge.me.
 *
 * Deliberately free of runtime imports and of the `~/` alias — like `i18n.ts`
 * and `hero.ts` — so `scripts/reviews.test.mjs` can load it through Node's
 * native type stripping and exercise the real functions. Keep it that way. The
 * network half lives in `reviews.server.ts`.
 *
 * Judge.me's `/reviews` endpoint returns RAW reviews: unpublished ones, spam,
 * the reviewer's email and IP, and text it has not sanitized. Everything that
 * reaches the page goes through `toProductReview` first. It keeps only reviews
 * the merchant has published, drops every personal field, and reduces the
 * name to "First L.". React renders the text as text, never as HTML, so
 * unsanitized input can't become markup.
 */

/** The subset of Judge.me's raw review object this file reads. */
export type JudgemeReview = {
  id: number;
  title?: string | null;
  body?: string | null;
  rating?: number | null;
  pinned?: boolean | null;
  product_external_id?: number | null;
  reviewer?: {name?: string | null} | null;
  curated?: string | null;
  hidden?: boolean | null;
  verified?: string | null;
  created_at?: string | null;
};

export type ProductReview = {
  id: number;
  /** Shopify's numeric product id, which Judge.me calls the external id. */
  productId: number;
  rating: number;
  title: string;
  body: string;
  author: string;
  verified: boolean;
  pinned: boolean;
  /** ISO timestamp, for sorting and `<time dateTime>`. */
  createdAt: string;
  /** Pre-formatted on the server so hydration can't disagree about it. */
  dateLabel: string;
};

export type ReviewSummary = {
  /** Rounded to one decimal, e.g. 4.7. 0 when there are no reviews. */
  average: number;
  count: number;
};

export type ProductReviews = {
  summary: ReviewSummary;
  reviews: ProductReview[];
};

/**
 * The statuses Judge.me documents as "verified". Anything else, including
 * `unconfirmed-buyer`, is shown without the badge.
 */
const VERIFIED_STATUSES = new Set([
  'confirmed-buyer',
  'buyer',
  'verified-purchase',
  'semi-verified-purchase',
  'admin',
]);

/**
 * Published means `curated: "ok"` and not archived. A `not-yet` review is
 * waiting for moderation, and Judge.me says whether it shows depends on the
 * store's auto-publish setting, which this API doesn't expose. So it stays off
 * the page: hiding a good review until it's approved is recoverable, but
 * showing spam is not.
 */
export function isPublished(review: JudgemeReview) {
  return review.curated === 'ok' && !review.hidden;
}

/** `gid://shopify/Product/123` -> 123. */
export function numericProductId(gid: string) {
  const id = Number(gid.split('/').pop());
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/**
 * "Jane Doe" -> "Jane D.", "jane" -> "jane", "" -> "Pawstie customer".
 * Judge.me lets the store choose a name format, but the raw API ignores it and
 * returns the full name. Always shortening it is the privacy-safe choice.
 */
export function displayName(name: string | null | undefined) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'Pawstie customer';
  const [first, ...rest] = parts;
  const last = rest.at(-1);
  return last ? `${first} ${last[0].toUpperCase()}.` : first;
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};

/**
 * Reduces review text to plain text for display. This is NOT the XSS defence;
 * React escaping is. It just stops a stray `<br>` or `&amp;` from showing up
 * literally. Paragraph breaks are kept as `\n`, and the component renders them
 * with `white-space: pre-line`.
 */
export function plainText(value: string | null | undefined) {
  return (value ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITIES[entity])
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  // Fixed zone: the server and the browser must print the same day.
  timeZone: 'UTC',
});

/**
 * Raw review -> what the page may see. Returns null for anything that must not
 * be shown: unpublished, not tied to a product, or without a usable rating or
 * body.
 */
export function toProductReview(review: JudgemeReview): ProductReview | null {
  if (!isPublished(review)) return null;

  const productId = review.product_external_id;
  const rating = Math.round(Number(review.rating));
  const body = plainText(review.body);
  const created = new Date(review.created_at ?? '');

  if (!productId || !Number.isSafeInteger(productId)) return null;
  if (!(rating >= 1 && rating <= 5)) return null;
  if (!body || Number.isNaN(created.getTime())) return null;

  return {
    id: review.id,
    productId,
    rating,
    title: plainText(review.title),
    body,
    author: displayName(review.reviewer?.name),
    verified: VERIFIED_STATUSES.has(review.verified ?? ''),
    pinned: Boolean(review.pinned),
    createdAt: created.toISOString(),
    dateLabel: DATE_FORMAT.format(created),
  };
}

/** Pinned reviews first (the merchant chose them), then newest first. */
export function sortReviews(reviews: ProductReview[]) {
  return [...reviews].sort(
    (a, b) =>
      Number(b.pinned) - Number(a.pinned) ||
      b.createdAt.localeCompare(a.createdAt),
  );
}

export function summarize(reviews: ProductReview[]): ReviewSummary {
  if (!reviews.length) return {average: 0, count: 0};
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return {
    average: Math.round((total / reviews.length) * 10) / 10,
    count: reviews.length,
  };
}

export function reviewsForProduct(
  all: ProductReview[],
  productId: number,
): ProductReviews {
  const reviews = sortReviews(
    all.filter((review) => review.productId === productId),
  );
  return {summary: summarize(reviews), reviews};
}

/**
 * Walks Judge.me's pagination. The response doesn't include a total, so a page
 * shorter than the page size Judge.me reports back is treated as the last one.
 * That way a server-side cap on `per_page` ends the loop correctly instead of
 * cutting it short. `maxPages` is a backstop against a loop that never ends.
 */
export async function collectPages<T>(
  fetchPage: (page: number) => Promise<{items: T[]; perPage: number}>,
  maxPages: number,
) {
  const items: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const result = await fetchPage(page);
    items.push(...result.items);
    if (!result.items.length || result.items.length < result.perPage) break;
  }
  return items;
}

export const REVIEW_LIMITS = {
  name: 80,
  email: 254,
  title: 120,
  body: 5000,
  bodyMin: 10,
} as const;

export type ReviewSubmission = {
  rating: number;
  name: string;
  email: string;
  title: string;
  body: string;
};

export type ReviewFieldErrors = Partial<
  Record<keyof ReviewSubmission, string>
>;

/** What /api/reviews answers the write-a-review form with. */
export type ReviewActionResult =
  | {ok: true}
  | {ok: false; errors?: ReviewFieldErrors; error?: string};

/**
 * Validates the write-a-review form. `website` is a honeypot: the field is
 * hidden from people, so anything in it came from a bot. Judge.me still
 * moderates every web review; this just keeps junk from reaching its queue.
 */
export function parseReviewSubmission(
  input: Record<string, unknown>,
):
  | {ok: true; data: ReviewSubmission}
  | {ok: false; bot?: true; errors: ReviewFieldErrors} {
  const text = (key: string) =>
    typeof input[key] === 'string' ? (input[key] as string).trim() : '';

  if (text('website')) return {ok: false, bot: true, errors: {}};

  const rating = Number(text('rating'));
  const name = text('name');
  const email = text('email');
  const title = text('title');
  const body = text('body');
  const errors: ReviewFieldErrors = {};

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.rating = 'Choose a star rating.';
  }
  if (!name) errors.name = 'Add your name.';
  else if (name.length > REVIEW_LIMITS.name) errors.name = 'That name is too long.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > REVIEW_LIMITS.email) {
    errors.email = 'Enter a valid email address.';
  }
  if (title.length > REVIEW_LIMITS.title) errors.title = 'Keep the title under 120 characters.';
  if (body.length < REVIEW_LIMITS.bodyMin) {
    errors.body = 'Tell us a little more (at least 10 characters).';
  } else if (body.length > REVIEW_LIMITS.body) {
    errors.body = 'Keep the review under 5,000 characters.';
  }

  if (Object.keys(errors).length) return {ok: false, errors};
  return {ok: true, data: {rating, name, email, title, body}};
}
