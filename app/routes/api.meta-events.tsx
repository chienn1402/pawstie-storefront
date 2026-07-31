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
 * signal (IP, user agent, _fbp/_fbc cookies) is read from the request here
 * rather than accepted from the body. The worst a forged request can do is
 * replay an event shape that the pixel already emits.
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

  const userData: Record<string, unknown> = {};
  if (ip) userData.client_ip_address = ip;
  const userAgent = headers.get('user-agent');
  if (userAgent) userData.client_user_agent = userAgent;
  const fbp = readCookie(cookie, '_fbp');
  if (fbp) userData.fbp = fbp;
  const fbc = readCookie(cookie, '_fbc');
  if (fbc) userData.fbc = fbc;

  const payload = {
    data: [
      {
        event_name: event,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        event_source_url: url,
        action_source: 'website',
        user_data: userData,
        custom_data:
          body.params && typeof body.params === 'object' ? body.params : {},
      },
    ],
  };

  // Tagging as test traffic makes events show up live in Events Manager ->
  // Test events, at the cost of being excluded from reporting. Set only in
  // local/preview environments — see the note in env.d.ts.
  const testCode = context.env.PRIVATE_META_CAPI_TEST_CODE;

  const send = fetch(
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
  )
    .then(async (response) => {
      if (!response.ok) {
        // Log and move on: a dropped analytics event must never surface to the
        // shopper or fail the request they were actually making.
        console.error(
          '[meta-capi] rejected',
          response.status,
          await response.text(),
        );
      }
    })
    .catch((error: Error) => {
      console.error('[meta-capi] request failed', error.message);
    });

  // Keep the worker alive for the outbound call without making the browser
  // wait on it.
  context.waitUntil?.(send);

  return new Response(null, {status: 202});
}
