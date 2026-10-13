import {useEffect} from 'react';
import {useAnalytics} from '@shopify/hydrogen';
import {
  TIKTOK_PIXEL_ID,
  appendScript,
  isPixelHost,
  numericId,
} from '~/lib/pixels';

/**
 * TikTok Pixel, driven off Hydrogen's analytics events rather than TikTok's
 * copy-paste snippet — same shape as MetaPixel.tsx, and the notes there apply
 * here too:
 *
 * 1. Consent gates everything. `Analytics.Provider` turns `publish()` into a
 *    no-op unless `canTrack()` is true. If the shop requires consent in the
 *    visitor's region and none was collected, no events fire. Don't "fix" that
 *    by overriding `canTrack`.
 * 2. It only runs on the production host (see `isPixelHost`), so preview
 *    deploys don't pollute the ad account.
 *
 * TikTok-specific things worth knowing:
 *
 * - `content_id` has to match the item id in the TikTok catalog for the events
 *   to be usable for product-level optimization. The Shopify → TikTok feed
 *   keys on the *variant* id, which is what `numericId(variantId)` yields.
 * - Purchase is deliberately absent: checkout happens on Shopify's domain, so
 *   it has to come from the TikTok sales channel / a checkout web pixel.
 */

type TikTokQueue = {
  page?: (...args: unknown[]) => void;
  track?: (
    event: string,
    params?: Record<string, unknown>,
    options?: {event_id: string},
  ) => void;
};

declare global {
  interface Window {
    ttq?: TikTokQueue;
    TiktokAnalyticsObject?: string;
  }
}

/** TikTok's queue: an array of calls with the stub methods hung off it. */
type Deferred = unknown[] & Record<string, unknown>;

const TIKTOK_METHODS = [
  'page',
  'track',
  'identify',
  'instances',
  'debug',
  'on',
  'off',
  'once',
  'ready',
  'alias',
  'group',
  'enableCookie',
  'disableCookie',
  'holdConsent',
  'revokeConsent',
  'grantConsent',
];

/**
 * TikTok's base code, ported from the copy-paste snippet so it runs in an
 * effect after hydration instead of as an inline script (see `appendScript`).
 * It keeps the snippet's structure because events.js reads it back: the
 * `methods` list, `setAndDefer`, `instance`, and the `_i`/`_t`/`_o` registries.
 * The snippet's trailing `ttq.page()` is left out, because the page_viewed
 * subscriber owns that, and keeping both double-counts the first pageview of
 * every session and every client-side navigation after it.
 */
function installTikTokPixel(pixelId: string) {
  if (window.ttq) return;
  window.TiktokAnalyticsObject = 'ttq';

  const ttq = [] as unknown as Deferred;
  const setAndDefer = (target: Deferred, method: string) => {
    target[method] = (...args: unknown[]) => {
      target.push([method, ...args]);
    };
  };

  ttq.methods = TIKTOK_METHODS;
  ttq.setAndDefer = setAndDefer;
  for (const method of TIKTOK_METHODS) setAndDefer(ttq, method);

  ttq.instance = (id: string) => {
    const registry = (ttq._i ?? {}) as Record<string, Deferred | undefined>;
    const instance = registry[id] ?? ([] as unknown as Deferred);
    for (const method of TIKTOK_METHODS) setAndDefer(instance, method);
    return instance;
  };

  ttq.load = (id: string, options?: Record<string, unknown>) => {
    const src = 'https://analytics.tiktok.com/i18n/pixel/events.js';
    const registry = (ttq._i ??= {}) as Record<string, Deferred>;
    registry[id] = [] as unknown as Deferred;
    registry[id]._u = src;
    ((ttq._t ??= {}) as Record<string, number>)[id] = Date.now();
    ((ttq._o ??= {}) as Record<string, unknown>)[id] = options ?? {};
    appendScript(`${src}?sdkid=${id}&lib=ttq`);
  };

  window.ttq = ttq as unknown as TikTokQueue;
  (ttq.load as (id: string) => void)(pixelId);
}

/**
 * Sends each event down both paths with one shared id: `ttq.track()` in the
 * browser, and /api/tiktok-events which forwards to the Events API
 * server-side. TikTok deduplicates on (pixel, event, event_id) for 48 hours,
 * keeping whichever copy arrives first — so an event that survives both is
 * counted once, and one whose browser half is blocked still arrives.
 *
 * Page views don't come through here: `ttq.page()` takes no event_id, so a
 * server-side copy could not be deduplicated against it.
 */
function track(event: string, params: Record<string, unknown>) {
  const eventId = crypto.randomUUID();

  window.ttq?.track?.(event, params, {event_id: eventId});

  // keepalive so the request survives the navigation that often follows.
  // Analytics must never break the page, hence the swallowed rejection.
  void fetch('/api/tiktok-events', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({event, eventId, url: window.location.href, params}),
    keepalive: true,
  }).catch(() => {});
}

export function TikTokPixel({origin}: {origin: string}) {
  const {subscribe, register} = useAnalytics();
  const enabled = Boolean(TIKTOK_PIXEL_ID) && isPixelHost(origin);

  // Register unconditionally: Hydrogen holds back *all* analytics events until
  // every registered integration calls ready(), so an early return here would
  // silently break Shopify's own analytics on non-production hosts.
  const {ready} = register('TikTok Pixel');

  useEffect(() => {
    if (!enabled) {
      ready();
      return;
    }

    installTikTokPixel(TIKTOK_PIXEL_ID);

    subscribe('page_viewed', () => {
      window.ttq?.page?.();
    });

    subscribe('product_viewed', (payload) => {
      const products = payload.products ?? [];
      const contents = products
        .map((product) => ({
          content_id: numericId(product.variantId),
          content_type: 'product',
          content_name: product.title,
          quantity: 1,
          price: Number(product.price ?? 0),
        }))
        .filter((content) => content.content_id);
      if (!contents.length) return;

      track('ViewContent', {
        contents,
        content_type: 'product',
        value: Number(products[0]?.price ?? 0),
        currency: payload.shop?.currency,
      });
    });

    subscribe('product_added_to_cart', (payload) => {
      const line = payload.currentLine;
      const id = numericId(line?.merchandise?.id);
      if (!line || !id) return;

      // Hydrogen fires this on any quantity increase, so report the delta
      // rather than the line's new total.
      const added = line.quantity - (payload.prevLine?.quantity ?? 0);
      const quantity = added > 0 ? added : line.quantity;

      // Price the delta, not the line: `totalAmount` covers the line's whole
      // quantity, so adding one item to a line that already held two would
      // report three items' worth of value against quantity 1 and inflate what
      // TikTok optimizes bids on. `amountPerQuantity` is the unit price.
      const unitPrice = Number(line.cost?.amountPerQuantity?.amount ?? 0);

      track('AddToCart', {
        contents: [
          {
            content_id: id,
            content_type: 'product',
            content_name: line.merchandise?.product?.title,
            quantity,
            price: unitPrice,
          },
        ],
        content_type: 'product',
        value: unitPrice * quantity,
        currency: line.cost?.amountPerQuantity?.currencyCode,
      });
    });

    // TikTok's standard-events reference names the search term `search_string`
    // while its own pixel examples use `query`. Sending both costs nothing —
    // unknown parameters are ignored — and avoids a silently empty Search term.
    subscribe('search_viewed', (payload) => {
      track('Search', {
        query: payload.searchTerm,
        search_string: payload.searchTerm,
      });
    });

    // TikTok has no category event among its 18 standard events, so this goes
    // out under a custom name. It records the signal, but to use it for
    // optimization or audiences you must first declare ViewCategory as a
    // custom event in Events Manager.
    subscribe('collection_viewed', (payload) => {
      const id = numericId(payload.collection?.id);
      if (!id) return;

      track('ViewCategory', {
        content_type: 'product_group',
        contents: [
          {
            content_id: id,
            content_type: 'product_group',
            content_name: payload.collection?.handle,
          },
        ],
      });
    });

    ready();
  }, [enabled, subscribe, ready]);

  return null;
}
