import {CacheCustom, type WithCache} from '@shopify/hydrogen';
import {
  collectPages,
  reviewsForProduct,
  toProductReview,
  type JudgemeReview,
  type ProductReview,
  type ProductReviews,
  type ReviewSubmission,
} from '~/lib/reviews';

/**
 * Judge.me, read server-side so the private token never reaches the browser
 * and reviews are in the HTML on first paint, without a client-side widget
 * script to load.
 *
 * Inert unless PRIVATE_JUDGEME_API_TOKEN is set, like the pixel event routes.
 * Without it, every product page renders exactly as before, and local dev and
 * preview deploys can't post reviews into the real Judge.me store.
 */

const API_URL = 'https://api.judge.me/api/v1';

/**
 * One cache entry for the whole store rather than one per product. The raw API
 * filters by Judge.me's own product id, which we don't have, so we fetch every
 * review and filter by Shopify id ourselves. That's one request per cache
 * window for all product pages, and fine for a catalogue this size. Past a few
 * thousand reviews it should move to per-product requests.
 *
 * A new or moderated review shows up within 10 minutes. After that the stale
 * copy is served instantly while a fresh one is fetched in the background.
 */
const CACHE = CacheCustom({
  mode: 'public',
  maxAge: 600,
  staleWhileRevalidate: 86400,
});
const PER_PAGE = 100;
const MAX_PAGES = 20;
/**
 * The product page waits for reviews, because the stars sit under the title
 * and shouldn't pop in. Cache hits are instant. On a cold cache, a slow Judge.me
 * costs at most this long before the page renders without reviews.
 */
const READ_TIMEOUT_MS = 2500;
const WRITE_TIMEOUT_MS = 8000;

export function createReviewsClient({
  env,
  withCache,
}: {
  env: Env;
  withCache: WithCache;
}) {
  const token = env.PRIVATE_JUDGEME_API_TOKEN;
  const shopDomain = env.PUBLIC_STORE_DOMAIN;
  const enabled = Boolean(token && shopDomain);

  async function fetchPage(page: number) {
    const url = new URL(`${API_URL}/reviews`);
    url.searchParams.set('shop_domain', shopDomain);
    url.searchParams.set('per_page', String(PER_PAGE));
    url.searchParams.set('page', String(page));

    const response = await fetch(url, {
      headers: {'X-Api-Token': token!, Accept: 'application/json'},
      signal: AbortSignal.timeout(READ_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`Judge.me reviews request failed: ${response.status}`);
    }
    const body = (await response.json()) as {
      per_page?: number;
      reviews?: JudgemeReview[];
    };
    return {
      items: body.reviews ?? [],
      perPage: Number(body.per_page) || PER_PAGE,
    };
  }

  /**
   * Every published review in the store, already reduced to display-safe
   * fields. What lands in the cache has no emails, IPs or unpublished reviews.
   */
  function allReviews() {
    return withCache.run<ProductReview[] | null>(
      {
        cacheKey: ['judgeme', 'reviews', shopDomain],
        cacheStrategy: CACHE,
        shouldCacheResult: (result) => result !== null,
      },
      async ({addDebugData}) => {
        addDebugData({displayName: 'Judge.me reviews'});
        const raw = await collectPages(fetchPage, MAX_PAGES);
        return raw
          .map(toProductReview)
          .filter((review): review is ProductReview => review !== null);
      },
    );
  }

  return {
    enabled,

    /**
     * Published reviews for one product. Resolves null when reviews are off or
     * Judge.me fails, so the page simply leaves the section out. A reviews
     * outage must never take a product page down.
     */
    async forProduct(productId: number | null): Promise<ProductReviews | null> {
      if (!enabled || !productId) return null;
      try {
        const all = await allReviews();
        return all ? reviewsForProduct(all, productId) : null;
      } catch (error) {
        console.error(error);
        return null;
      }
    },

    /**
     * Creates a web review, which then waits in Judge.me's moderation queue.
     * Judge.me's create endpoint is unauthenticated by design. Going through
     * this server keeps validation and the honeypot in one place, and passes
     * the shopper's IP, so the review's location isn't Oxygen's.
     */
    async submit({
      productId,
      review,
      ip,
    }: {
      productId: number;
      review: ReviewSubmission;
      ip: string | null;
    }) {
      if (!enabled) return false;
      const response = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          shop_domain: shopDomain,
          platform: 'shopify',
          id: productId,
          name: review.name,
          email: review.email,
          rating: review.rating,
          title: review.title || undefined,
          body: review.body,
          // Match how the page prints names, so Judge.me's own widgets and
          // emails don't show more of the reviewer's name than we do.
          reviewer_name_format: 'last_initial',
          ...(ip ? {ip_addr: ip} : {}),
        }),
        signal: AbortSignal.timeout(WRITE_TIMEOUT_MS),
      });
      if (!response.ok) {
        console.error(`Judge.me review submit failed: ${response.status}`);
      }
      return response.ok;
    },
  };
}

export type ReviewsClient = ReturnType<typeof createReviewsClient>;
