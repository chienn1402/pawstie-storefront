import {useEffect} from 'react';
import {parseGid, useAnalytics, useNonce} from '@shopify/hydrogen';

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
 * 2. It only runs on the production host (see PIXEL_HOSTS). Every branch
 *    deploys to Oxygen, so without this guard preview traffic would be mixed
 *    into the ad account's optimization data.
 *
 * Purchase is deliberately absent: checkout happens on Shopify's domain, so it
 * has to come from the Meta sales channel / a checkout web pixel, not here.
 */

const PIXEL_ID = '1718042242858307';

/** Hosts allowed to send events. Add a preview host here to test a deploy. */
const PIXEL_HOSTS = ['pawstie.com', 'www.pawstie.com'];

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
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

/** `gid://shopify/ProductVariant/123` -> `123`, which is what Meta catalogs key on. */
function numericId(gid?: string | null) {
  if (!gid) return null;
  try {
    return parseGid(gid).id || null;
  } catch {
    return null;
  }
}

function isPixelHost(origin: string) {
  try {
    return PIXEL_HOSTS.includes(new URL(origin).hostname);
  } catch {
    return false;
  }
}

export function MetaPixel({origin}: {origin: string}) {
  const nonce = useNonce();
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

  if (!enabled) return null;

  // Meta's loader, minus its trailing `fbq('track','PageView')` — the
  // page_viewed subscriber above owns that, and keeping both double-counts
  // the first pageview of every session.
  const bootstrap = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL_ID}');`;

  return <script nonce={nonce} dangerouslySetInnerHTML={{__html: bootstrap}} />;
}
