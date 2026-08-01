import {ServerRouter} from 'react-router';
import {isbot} from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {
  createContentSecurityPolicy,
  type HydrogenRouterContextProvider,
} from '@shopify/hydrogen';
import type {EntryContext} from 'react-router';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  context: HydrogenRouterContextProvider,
) {
  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    shop: {
      checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    },
    mediaSrc: [
      "'self'",
      'https://cdn.shopify.com',
      `https://${context.env.PUBLIC_STORE_DOMAIN}`,
    ],
    frameSrc: [
      "'self'",
      'https://www.youtube.com',
      'https://player.vimeo.com',
      // fbevents.js delivers most events through a hidden iframe on
      // facebook.com, falling back to an image beacon only for small payloads.
      // Without this, every ViewContent/AddToCart is blocked in the browser as
      // a frame-src violation while the CAPI half still lands — so the pixel
      // looks alive but the browser signal, and with it event match quality,
      // quietly disappears.
      //
      // Keep quotation marks out of these comments: getCspDirectiveSources in
      // scripts/product-gallery-media.test.mjs scrapes every quoted string in
      // the array block, so a quoted example reads as an extra source.
      'https://www.facebook.com',
    ],
    scriptSrc: [
      "'self'",
      'https://cdn.shopify.com',
      'https://shopify.com',
      'https://unpkg.com/@google/model-viewer@v1.12.1/dist/model-viewer.min.js',
      // Meta Pixel loader. The inline bootstrap in MetaPixel.tsx carries the
      // nonce; the fbevents.js tag it injects does not, so the host must be
      // allowlisted here or the pixel never loads.
      'https://connect.facebook.net',
    ],
    // fbevents.js beacons to facebook.com by fetch/sendBeacon.
    // connectSrc MERGES with Hydrogen's defaults (Shopify CDN, monorail,
    // checkout + store domains stay intact), so listing only Facebook is safe.
    connectSrc: ['https://www.facebook.com'],
    // imgSrc does NOT merge, and there was no img-src before this — images
    // fell back to default-src. Passing Facebook alone would have created an
    // img-src that blocked every Shopify CDN image on the site, so this
    // restates default-src's sources verbatim and adds Facebook for the
    // pixel's image-beacon fallback.
    imgSrc: [
      "'self'",
      'https://cdn.shopify.com',
      'https://shopify.com',
      'https://www.facebook.com',
    ],
  });

  const body = await renderToReadableStream(
    <NonceProvider>
      <ServerRouter
        context={reactRouterContext}
        url={request.url}
        nonce={nonce}
      />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', header);

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
