import type {Route} from './+types/api.tiktok-events';
import {TIKTOK_PIXEL_ID} from '~/lib/pixels';

/**
 * Server-side half of the TikTok Pixel, mirroring api.meta-events.tsx: forwards
 * events to TikTok's Events API so they survive ad blockers and tracking
 * prevention, which drop a meaningful share of browser-only `ttq.track()`
 * calls. The browser request that gets here is first-party (pawstie.com), so
 * blockers that filter analytics.tiktok.com never see it.
 *
 * TikTokPixel.tsx sends the *same* `event_id` from the browser, and TikTok
 * deduplicates on (event_source_id, event, event_id) for 48 hours — keeping the
 * first copy to arrive and dropping the second. So an event that makes it
 * through both paths is counted once, and one that loses the browser path still
 * lands.
 *
 * This endpoint is public, so it deliberately trusts the client for as little
 * as possible: the event name must be on ALLOWED_EVENTS, and every identity
 * signal — IP, user agent, ttclid/_ttp, _shopify_y, and the hashed email/phone
 * off the cart — is derived from the request here rather than accepted from the
 * body. The worst a forged request can do is replay an event shape the pixel
 * already emits; it cannot attach an identity of its choosing.
 */

/** Events API 2.0. Pinned deliberately — unpinned would drift. */
const API_URL = 'https://business-api.tiktok.com/open_api/v1.3/event/track/';

/**
 * Mirrors the events TikTokPixel.tsx sends through `track()`. Anything else is
 * dropped.
 *
 * Pageview is deliberately absent. The browser reports it with `ttq.page()`,
 * which takes no `event_id` argument — so a server-side copy could not be
 * deduplicated against it and would simply double-count every page view. Page
 * views are not an optimization signal anyway; ViewContent and AddToCart are,
 * and both carry an id.
 */
const ALLOWED_EVENTS = new Set([
  'ViewContent',
  'AddToCart',
  'Search',
  'ViewCategory',
]);

/**
 * Events worth spending a cart round-trip on. Buyer identity is almost always
 * empty before checkout, so querying it on every ViewContent would add
 * Storefront API traffic to learn nothing. AddToCart is the highest-intent
 * event we emit and the one where a cart reliably exists.
 */
const IDENTITY_EVENTS = new Set(['AddToCart']);

type IncomingEvent = {
  event?: unknown;
  eventId?: unknown;
  url?: unknown;
  params?: unknown;
};

function readCookie(cookieHeader: string | null, name: string) {
  const match = cookieHeader?.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : undefined;
}

/** TikTok matches on SHA-256 hex of a normalized value, never the raw one. */
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
 * `ttclid` is what ties an event back to the ad that was clicked. The SDK
 * copies it from the landing URL into a cookie, but on the very first request
 * after an ad click the pixel and this fetch race — and the pixel usually
 * loses, so the click that matters most is the one that arrives without it.
 * Falling back to the URL closes that gap.
 *
 * Unlike Meta's `_fbc` there is no wrapper format here: TikTok wants the raw
 * click id exactly as it appeared in the query string.
 */
function ttclidFromUrl(url: string | undefined) {
  if (!url) return undefined;
  try {
    return new URL(url).searchParams.get('ttclid') ?? undefined;
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
  const token = context.env.PRIVATE_TIKTOK_EAPI_TOKEN;

  // No token or no pixel id (local dev, preview deploys) -> silently do
  // nothing. The browser pixel still works; this half is simply inert.
  if (!token || !TIKTOK_PIXEL_ID) return new Response(null, {status: 204});
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

  // ttclid and ttp are sent raw — only the email/phone/external_id fields are
  // hashed. Hashing these would make them unmatchable.
  const user: Record<string, unknown> = {};
  if (ip) user.ip = ip;
  const userAgent = headers.get('user-agent');
  if (userAgent) user.user_agent = userAgent;
  const ttp = readCookie(cookie, '_ttp');
  if (ttp) user.ttp = ttp;
  const ttclid = readCookie(cookie, 'ttclid') ?? ttclidFromUrl(url);
  if (ttclid) user.ttclid = ttclid;

  // `_shopify_y` is Shopify's durable visitor id, and Shopify forwards it to
  // checkout as the `_y` param — so the same value identifies this shopper on
  // pawstie.com and on checkout.pawstie.com. That makes it the one identifier
  // available on anonymous traffic that TikTok can match across both surfaces.
  const shopifyY = readCookie(cookie, '_shopify_y');

  // Tagging as test traffic makes events show up live in Events Manager ->
  // Test Events, at the cost of being excluded from reporting. Set only in
  // local/preview environments — see the note in env.d.ts.
  const testCode = context.env.PRIVATE_TIKTOK_EAPI_TEST_CODE;

  async function send() {
    if (shopifyY) user.external_id = await sha256(shopifyY);

    // Email/phone are read from the cart server-side, never from the request
    // body — the same reason the rest of `user` is. A forged request must not
    // be able to attach someone else's identity to an event.
    if (IDENTITY_EVENTS.has(event)) {
      const {email, phone} = await cartIdentity(context);
      if (email) user.email = await sha256(email.trim().toLowerCase());

      // TikTok requires E.164 (leading +, country code) before hashing, which
      // is stricter than Meta's digits-only rule. Shopify normalizes
      // buyerIdentity.phone to E.164, but if we ever get a bare local number we
      // cannot know its country — and guessing one produces a hash that can
      // never match. Skipping is the honest outcome.
      if (phone?.startsWith('+')) {
        const digits = phone.replace(/\D/g, '');
        if (digits) user.phone = await sha256(`+${digits}`);
      }
    }

    const payload = {
      event_source: 'web',
      event_source_id: TIKTOK_PIXEL_ID,
      ...(testCode ? {test_event_code: testCode} : {}),
      data: [
        {
          event,
          event_time: Math.floor(now / 1000),
          event_id: eventId,
          user,
          properties:
            body.params && typeof body.params === 'object' ? body.params : {},
          ...(url ? {page: {url}} : {}),
        },
      ],
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Token': token!,
        },
        body: JSON.stringify(payload),
      });

      // TikTok answers 200 even when it rejects the event — success is `code: 0`
      // in the body, and a non-zero code carries the reason. Checking
      // response.ok alone (as the Meta route can) would hide every rejection.
      const result = (await response.json().catch(() => null)) as {
        code?: number;
        message?: string;
        request_id?: string;
      } | null;

      if (!response.ok || !result || result.code !== 0) {
        // Log and move on: a dropped analytics event must never surface to the
        // shopper or fail the request they were actually making.
        console.error(
          '[tiktok-eapi] rejected',
          response.status,
          result?.code,
          result?.message,
          result?.request_id,
        );
      }
    } catch (error) {
      console.error('[tiktok-eapi] request failed', (error as Error).message);
    }
  }

  // Keep the worker alive for the hashing, the cart read and the outbound call
  // without making the browser wait on any of them.
  context.waitUntil?.(send());

  return new Response(null, {status: 202});
}
