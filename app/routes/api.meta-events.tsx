import type {Route} from './+types/api.meta-events';

/**
 * Server-side half of the Meta Pixel: forwards events to the Conversions API
 * so they survive ad blockers and iOS tracking prevention, which drop a
 * meaningful share of browser-only `fbq()` calls.
 *
 * MetaPixel.tsx sends the *same* `event_id` from the browser, and Meta
 * deduplicates on (event_name, event_id) — so an event that makes it through
 * both paths is counted once, and one that loses the browser path still lands.
 *
 * This endpoint is public, so it deliberately trusts the client for as little
 * as possible: the event name must be on ALLOWED_EVENTS, and every identity
 * signal — IP, user agent, _fbp/_fbc, _shopify_y, and the hashed email/phone
 * off the cart — is derived from the request here rather than accepted from
 * the body. The worst a forged request can do is replay an event shape that
 * the pixel already emits; it cannot attach an identity of its choosing.
 */

const PIXEL_ID = '1718042242858307';

/** Pinned deliberately. v21/v23/v25 all accept today; unpinned would drift. */
const API_VERSION = 'v23.0';

/** Mirrors the events MetaPixel.tsx emits. Anything else is dropped. */
const ALLOWED_EVENTS = new Set([
  'PageView',
  'ViewContent',
  'AddToCart',
  'Search',
  'ViewCategory',
]);

/**
 * Events worth spending a cart round-trip on. Buyer identity is almost always
 * empty before checkout, so querying it on every PageView would double this
 * storefront's Storefront API traffic to learn nothing. AddToCart is the
 * highest-intent event we emit and the one where a cart reliably exists.
 */
const IDENTITY_EVENTS = new Set(['AddToCart']);

type IncomingEvent = {
  event?: unknown;
  eventId?: unknown;
  url?: unknown;
  params?: unknown;
};

function readCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/** Meta matches on SHA-256 hex of a normalized value, never the raw one. */
async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * `_fbc` is what ties an event back to the ad that was clicked. fbevents.js
 * writes it from the `fbclid` query param, but on the very first request after
 * an ad click the pixel and this fetch race — and the pixel usually loses, so
 * the click that matters most is the one that arrives without `fbc`.
 * Rebuilding it from the URL closes that gap.
 *
 * Format is Meta's own: fb.<subdomainIndex>.<creationTime>.<fbclid>. Index 1
 * matches what fbevents writes for this apex domain — the live `_fbp` on
 * pawstie.com reads `fb.1.…`, so a synthesized `fbc` stays consistent with it.
 */
function fbcFromUrl(url: string | undefined, createdAtMs: number) {
  if (!url) return undefined;
  try {
    const fbclid = new URL(url).searchParams.get('fbclid');
    return fbclid ? `fb.1.${createdAtMs}.${fbclid}` : undefined;
  } catch {
    return undefined;
  }
}

/** Email/phone off the cart, when the shopper has actually given us one. */
async function cartIdentity(context: Route.ActionArgs['context']) {
  try {
    const cart = await context.cart.get();
    const buyer = cart?.buyerIdentity;
    return {
      email: buyer?.email ?? buyer?.customer?.email ?? undefined,
      phone: buyer?.phone ?? undefined,
    };
  } catch {
    // Identity is a nice-to-have; a failed cart read must not drop the event.
    return {};
  }
}

export async function action({request, context}: Route.ActionArgs) {
  const token = context.env.PRIVATE_META_CAPI_TOKEN;

  // No token (local dev, preview deploys) -> silently do nothing. The browser
  // pixel still works; this half is simply inert.
  if (!token) return new Response(null, {status: 204});
  if (request.method !== 'POST') return new Response(null, {status: 405});

  let body: IncomingEvent;
  try {
    body = (await request.json()) as IncomingEvent;
  } catch {
    return new Response(null, {status: 400});
  }

  const event = typeof body.event === 'string' ? body.event : '';
  const eventId = typeof body.eventId === 'string' ? body.eventId : '';
  const url = typeof body.url === 'string' ? body.url : undefined;

  if (!ALLOWED_EVENTS.has(event) || !eventId) {
    return new Response(null, {status: 400});
  }

  const headers = request.headers;
  const cookie = headers.get('cookie');

  // Oxygen sets oxygen-buyer-ip; x-forwarded-for is the fallback elsewhere.
  const ip =
    headers.get('oxygen-buyer-ip') ??
    headers.get('x-forwarded-for')?.split(',')[0].trim();

  const now = Date.now();

  const userData: Record<string, unknown> = {};
  if (ip) userData.client_ip_address = ip;
  const userAgent = headers.get('user-agent');
  if (userAgent) userData.client_user_agent = userAgent;
  const fbp = readCookie(cookie, '_fbp');
  if (fbp) userData.fbp = fbp;
  const fbc = readCookie(cookie, '_fbc') ?? fbcFromUrl(url, now);
  if (fbc) userData.fbc = fbc;

  // `_shopify_y` is Shopify's durable visitor id, and Shopify forwards it to
  // checkout as the `_y` param — so the same value identifies this shopper on
  // pawstie.com and on checkout.pawstie.com. That makes it the one identifier
  // available on anonymous traffic that Meta can match across both surfaces.
  const shopifyY = readCookie(cookie, '_shopify_y');

  // Tagging as test traffic makes events show up live in Events Manager ->
  // Test events, at the cost of being excluded from reporting. Set only in
  // local/preview environments — see the note in env.d.ts.
  const testCode = context.env.PRIVATE_META_CAPI_TEST_CODE;

  async function send() {
    if (shopifyY) userData.external_id = await sha256(shopifyY);

    // Email/phone are read from the cart server-side, never from the request
    // body — the same reason the rest of user_data is. A forged request must
    // not be able to attach someone else's identity to an event.
    if (IDENTITY_EVENTS.has(event)) {
      const {email, phone} = await cartIdentity(context);
      if (email) userData.em = await sha256(email.trim().toLowerCase());
      // Meta wants digits only. A number stored without a country code still
      // hashes and sends; it just matches less often.
      if (phone) {
        const digits = phone.replace(/\D/g, '');
        if (digits) userData.ph = await sha256(digits);
      }
    }

    const payload = {
      data: [
        {
          event_name: event,
          event_time: Math.floor(now / 1000),
          event_id: eventId,
          event_source_url: url,
          action_source: 'website',
          user_data: userData,
          custom_data:
            body.params && typeof body.params === 'object' ? body.params : {},
        },
      ],
    };

    try {
      const response = await fetch(
        `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            ...payload,
            ...(testCode ? {test_event_code: testCode} : {}),
            access_token: token,
          }),
        },
      );
      if (!response.ok) {
        // Log and move on: a dropped analytics event must never surface to the
        // shopper or fail the request they were actually making.
        console.error(
          '[meta-capi] rejected',
          response.status,
          await response.text(),
        );
      }
    } catch (error) {
      console.error('[meta-capi] request failed', (error as Error).message);
    }
  }

  // Keep the worker alive for the hashing, the cart read and the outbound call
  // without making the browser wait on any of them.
  context.waitUntil?.(send());

  return new Response(null, {status: 202});
}
