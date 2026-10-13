import {useEffect} from 'react';
import {useAnalytics} from '@shopify/hydrogen';
import {appendScript, isPixelHost, numericId} from '~/lib/pixels';

/**
 * Meta (Facebook) Pixel, driven off Hydrogen's analytics events rather than
 * Meta's copy-paste snippet. Mounted inside `Analytics.Provider` so it can
 * subscribe to the same events the routes already publish
 * (`Analytics.ProductView`, `Analytics.CollectionView`, `Analytics.SearchView`).
 *
 * Two things worth knowing before debugging "the pixel isn't firing":
 *
 * 1. Consent gates everything. `Analytics.Provider` turns `publish()` into a
 *    no-op unless `canTrack()` is true, and the default `canTrack` is
 *    Shopify's `customerPrivacy.analyticsProcessingAllowed()`. If the shop
 *    requires consent in the visitor's region and none was collected, no
 *    events fire. That is intentional — don't "fix" it by overriding
 *    `canTrack`, which would track people who declined.
 * 2. It only runs on the production host (see `isPixelHost` in ~/lib/pixels).
 *    Every branch deploys to Oxygen, so without this guard preview traffic
 *    would be mixed into the ad account's optimization data.
 *
 * Purchase is deliberately absent: checkout happens on Shopify's domain, so it
 * has to come from the Meta sales channel / a checkout web pixel, not here.
 */

const PIXEL_ID = '1718042242858307';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

/** The stub Meta's base code builds; fbevents.js reads these fields off it. */
type FbqStub = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: FbqStub;
  loaded: boolean;
  version: string;
};

/**
 * Meta's base code, ported from the copy-paste snippet so it runs in an effect
 * after hydration instead of as an inline script (see `appendScript`). Same
 * stub as the snippet: calls queue until fbevents.js loads and replays them.
 * The snippet's trailing `fbq('track','PageView')` is left out, because the
 * page_viewed subscriber owns that, and keeping both double-counts the first
 * pageview of every session.
 */
function installMetaPixel() {
  if (window.fbq) return;
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as FbqStub;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  window.fbq = fbq;
  if (!window._fbq) window._fbq = fbq;
  appendScript('https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', PIXEL_ID);
}

/**
 * Sends each event down both paths with one shared id: `fbq()` in the browser,
 * and /api/meta-events which forwards to the Conversions API server-side. Meta
 * deduplicates on (event_name, event_id), so an event that survives both is
 * counted once — and one whose browser half is blocked still arrives.
 */
function track(
  method: 'track' | 'trackCustom',
  event: string,
  params: Record<string, unknown>,
) {
  const eventId = crypto.randomUUID();

  window.fbq?.(method, event, params, {eventID: eventId});

  // keepalive so the request survives the navigation that often follows.
  // Analytics must never break the page, hence the swallowed rejection.
  void fetch('/api/meta-events', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({event, eventId, url: window.location.href, params}),
    keepalive: true,
  }).catch(() => {});
}

export function MetaPixel({origin}: {origin: string}) {
  const {subscribe, register} = useAnalytics();
  const enabled = isPixelHost(origin);

  // Register unconditionally: Hydrogen holds back *all* analytics events until
  // every registered integration calls ready(), so an early return here would
  // silently break Shopify's own analytics on non-production hosts.
  const {ready} = register('Meta Pixel');

  useEffect(() => {
    if (!enabled) {
      ready();
      return;
    }

    installMetaPixel();

    subscribe('page_viewed', () => {
      track('track', 'PageView', {});
    });

    subscribe('product_viewed', (payload) => {
      const products = payload.products ?? [];
      const ids = products.map((p) => numericId(p.variantId)).filter(Boolean);
      if (!ids.length) return;

      track('track', 'ViewContent', {
        content_type: 'product',
        content_ids: ids,
        content_name: products[0]?.title,
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

      // Price the delta, not the line. `totalAmount` covers the line's whole
      // quantity, so adding one $19.99 item to a line that already held two
      // reported $59.97 against quantity 1 — inflating the value Meta optimizes
      // bids on. `amountPerQuantity` is the unit price, already in the fragment.
      const unitPrice = Number(line.cost?.amountPerQuantity?.amount ?? 0);

      track('track', 'AddToCart', {
        content_type: 'product',
        content_ids: [id],
        content_name: line.merchandise?.product?.title,
        value: unitPrice * quantity,
        currency: line.cost?.amountPerQuantity?.currencyCode,
        contents: [{id, quantity}],
      });
    });

    subscribe('search_viewed', (payload) => {
      track('track', 'Search', {search_string: payload.searchTerm});
    });

    // ViewCategory is a catalog event, not one of Meta's 18 standard events,
    // so it goes through trackCustom to avoid an "invalid event" warning.
    subscribe('collection_viewed', (payload) => {
      track('trackCustom', 'ViewCategory', {
        content_type: 'product_group',
        content_ids: [numericId(payload.collection?.id)].filter(Boolean),
        content_name: payload.collection?.handle,
      });
    });

    ready();
  }, [enabled, subscribe, ready]);

  return null;
}
