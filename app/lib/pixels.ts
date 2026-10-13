import {parseGid} from '@shopify/hydrogen';

/**
 * Shared plumbing for the ad-platform pixels (MetaPixel, TikTokPixel).
 *
 * Both need the same two things, and they must agree: which hosts are allowed
 * to send events, and how a Shopify GID becomes the numeric id the ad
 * platforms' product catalogs key on.
 */

/**
 * Hosts allowed to send events. Every branch deploys to Oxygen, so without
 * this guard preview traffic would be mixed into the ad accounts' optimization
 * data. Add a preview host here to test a deploy, then take it back out.
 */
const PIXEL_HOSTS = ['pawstie.com', 'www.pawstie.com'];

/**
 * TikTok Pixel ID, from Events Manager -> your pixel. Not a secret; it ships in
 * the page. It lives here rather than next to the component because both halves
 * need it — TikTokPixel.tsx to load the SDK and api.tiktok-events.tsx as
 * `event_source_id` — and the two MUST agree or TikTok cannot deduplicate the
 * browser and server copies of an event.
 *
 * Empty disables both halves, so an unset id is inert rather than half-wired.
 * (Meta's id predates this file and is still hardcoded in its own two places.)
 */
export const TIKTOK_PIXEL_ID = 'DA1GE03C77UBU14IJ580';

/**
 * Loads a pixel SDK by APPENDING it to <head>. Only ever call it from an effect,
 * i.e. after hydration.
 *
 * Both vendors' copy-paste snippets instead insert their SDK tag before the
 * page's first <script>. Rendered into the server HTML, that ran while the
 * page was still being built, before React took over: React then found a
 * script it hadn't rendered (on product pages, where it expected the JSON-LD
 * in <head>), threw hydration errors #418/#423 on every page, and re-rendered
 * the whole document in the browser. Never render a pixel snippet in JSX
 * again; port it into an effect.
 */
export function appendScript(src: string) {
  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

export function isPixelHost(origin: string) {
  try {
    return PIXEL_HOSTS.includes(new URL(origin).hostname);
  } catch {
    return false;
  }
}

/** `gid://shopify/ProductVariant/123` -> `123`, which is what the catalogs key on. */
export function numericId(gid?: string | null) {
  if (!gid) return null;
  try {
    return parseGid(gid).id || null;
  } catch {
    return null;
  }
}
