# Multi-Currency: US/CA Market Detection

## Goal

Serve Canadian visitors CAD prices end to end — catalog, product page, cart, checkout, and analytics — while leaving US visitors on exactly today's behavior. One URL per page; no market subfolders, no market domains, no second language.

## Current State

The storefront is single-currency by construction, not by accident:

- `app/lib/context.ts:56` hardcodes `i18n: {language: 'EN', country: 'US'}`. The comment above it is still the skeleton's "or detect from URL path based on locale subpath, cookies, or any other strategy" placeholder.
- Every Storefront document already declares `$country: CountryCode` and runs `@inContext(country: $country, language: $language)`. The Hydrogen storefront client injects those variables from `storefront.i18n` automatically, so the entire catalog re-prices the moment that one value changes.
- Nothing sets `buyerIdentity.countryCode` on the cart. `app/routes/cart.tsx:68` handles `BuyerIdentityUpdate` by spreading whatever the form sent, and no component sends a country.
- There is no country or currency selector anywhere in `app/`.
- No currency is hardcoded in application code. The only `USD` in `app/` is a comment in `app/components/landing/LandingStickyCta.tsx:94`. `ProductPrice` renders `Money` and formats savings with `price.currencyCode`, so it follows whatever the API returns.

Net effect: a Canadian shopper browses in USD, and because the cart is created in the US context, checkout on `checkout.pawstie.com` stays USD too. The Canada market exists in Admin but no traffic can reach it.

## Store-Side Facts (verified 2026-08-18)

- Base currency USD. `enabledPresentmentCurrencies: ["CAD", "USD"]`.
- Two active markets: **United States** (base USD) and **Canada** (base CAD), both `type: REGION`, both `localCurrencies: false` — each market has one fixed currency rather than converting into every buyer's local currency.
- Neither market has a catalog or price list attached. **CAD prices are therefore Shopify's automatic conversion of the USD price at the daily rate, plus the store's rounding rule.** There is no per-market price control until a Canada catalog is created; that is a merchandising decision, not a code change.
- Neither market has a web presence configured, which is expected for a headless storefront.

## Design

### 1. Country resolution — `app/lib/i18n.ts` (new)

A single pure module owns the question "which market is this request in." It exports the supported set (`US`, `CA`), the default (`US`), the fixed language (`EN`), and one function:

`resolveCountry({request, session})` returns a supported country code using this precedence:

1. **Explicit shopper choice** stored in the session, if it names a supported country.
2. **`oxygen-buyer-country`** request header, if it names a supported country. Oxygen sets this header from Cloudflare geo data; it is absent in local dev and can be absent in production, so it is never assumed present.
3. **`US`.**

Any country outside the supported set — GB, AU, anything — resolves to `US`. That is deliberate: only two markets exist, and a non-Canadian international buyer paying USD is precisely today's behavior, so this rule adds no regression surface.

The module imports nothing from Hydrogen and touches no globals beyond the `Request` it is handed, so it stays readable and independently checkable.

### 2. Wiring the context

`createHydrogenRouterContext` already initializes `AppSession` before it calls `createHydrogenContext`, so the session is available at the point where `i18n` is constructed. The hardcoded object at `app/lib/context.ts:56` becomes `{language: LANGUAGE, country: resolveCountry({request, session})}`. Nothing else in that file changes.

This one edit propagates to every loader, every `@inContext` query, the cart handler's own queries, and `getShopAnalytics`.

### 3. Shopper override and persistence

Auto-detection alone is not enough: a Canadian on a US IP, or anyone who prefers USD, needs a way out, and local development has no geo header at all.

- A **country/currency selector in the footer** offering "United States (USD)" and "Canada (CAD)", rendered as a real form, not a JS-only control.
- It posts to a new resource route, `app/routes/country.tsx`, whose action validates the submitted country against the supported set, writes it to the session, syncs the cart's buyer identity (below), and returns a `303` back to the submitted path.
- The session write flips `AppSession.isPending`, and `server.ts` already commits the cookie on pending sessions — no new plumbing.
- The `303` full-document response matters: `root.tsx` sets `shouldRevalidate` to skip root-loader revalidation on sub-navigation, so a client-side transition would leave stale header/footer data. A redirect re-runs every loader under the new country.

### 4. Cart and checkout

The cart's `buyerIdentity.countryCode` is what carries the market across to `checkout.pawstie.com`, and it is a separate value from the query context. Both must agree.

- The cart fragment already requests `buyerIdentity { countryCode }` (`app/lib/fragments.ts:128`), so the current value is readable without a fragment change.
- Add a small helper that compares the cart's `buyerIdentity.countryCode` to the resolved country and calls `cart.updateBuyerIdentity({countryCode})` when they differ. Invoke it from the country-switch action and from the cart route's `LinesAdd` branch, which is where a cart first comes into existence.
- Changing the country on a cart that already has lines re-prices those lines; Shopify handles that server-side and the updated cart comes back in the same response.

### 5. What must not be cached

HTML now varies by a request header and a cookie, so caching rules become load-bearing:

- **Today no route sets a public `Cache-Control` on HTML.** The only cache headers are `robots.txt` and the sitemap routes (country-independent), `account.tsx` (`no-store`), and the two landing pages (`X-Robots-Tag` only). This must stay true. A `max-age` on an HTML route would let one country's prices be served to the other.
- If a page ever does need edge caching, it needs `Vary: oxygen-buyer-country` plus the session cookie — and Shopify's own guidance warns that page caching ignores locale cookies and headers, so treat that as a last resort.
- Sub-request caching is already safe. `root.tsx` uses `storefront.CacheLong()` for the header and footer queries, but `$country` is part of those queries' variables and therefore part of the cache key, so US and CA get separate entries.

### 6. SEO

One URL serves two currencies, chosen per request. Googlebot crawls from US IPs with no cookie, so it resolves to `US` and sees USD — which keeps the canonical, the Open Graph tags, and `productJsonLd`'s `priceCurrency` consistent with what the crawler indexes. `app/lib/structured-data.ts:50` reads `variant.price.currencyCode` and needs no change.

Per-market URLs and `hreflang` are explicitly out of scope; adding them later is a separate design.

### 7. Analytics — verification only

No code change is expected here, but it must be confirmed rather than assumed:

- `getShopAnalytics` derives `currency` from `localization.country.currency.isoCode`, which follows `@inContext`. The Meta and TikTok `PageView`/`ViewContent` events read `payload.shop?.currency` (`MetaPixel.tsx:90`, `TikTokPixel.tsx:103`).
- Cart-derived events read `line.cost?.amountPerQuantity?.currencyCode` (`MetaPixel.tsx:115`, `TikTokPixel.tsx:135`).
- The server-side CAPI routes pass the client's `params`/`properties` object straight through to Meta and TikTok, so browser and server events stay in agreement by construction.

The result is mixed-currency event streams in both platforms, which is normal and which Ads Manager converts on its side.

## Testing and Verification

This repository has no test framework — `npm test` is `node --test` over `scripts/**/*.test.mjs`, currently one source-contract test. Adding a runner is out of scope for this work and needs its own conversation.

1. Extend the source-contract test (or add a sibling `.mjs` in the same style) to assert that `app/lib/context.ts` resolves the country rather than hardcoding it, and that `app/lib/i18n.ts` supports exactly `US` and `CA` with a `US` default. Run it before implementation to confirm it fails against the current code.
2. `npm run typecheck` (runs the tests first via `pretypecheck`), then `npm run lint`, then `npm run build`.
3. Local: `curl -H 'oxygen-buyer-country: CA'` against `npm run preview` and confirm CAD amounts in the HTML; confirm a bare request still returns USD.
4. Deployed: verify against the served response, not the asset hash — grep the returned HTML for the currency itself.
5. End to end: switch to Canada, add to cart, follow `checkoutUrl`, and confirm `checkout.pawstie.com` presents CAD.
6. Confirm Meta and TikTok events from a CA session carry `CAD` on both the browser and the CAPI side.

## Risks

- **Auto-converted prices float.** With no Canada catalog, CAD amounts move with the daily rate and can land on unrounded values. Set the market's rounding rule in Admin before launch; a Canada catalog with fixed prices is the durable fix.
- **Silent switching vs. a banner.** Shopify's localization guidance discourages auto-*redirecting* buyers and suggests a "switch country?" banner instead. This design does not redirect — the URL is unchanged and only pricing context moves — so silent switching plus a visible override is acceptable. If a more conservative posture is wanted, the same resolver can drive a dismissible banner and default everyone to USD until they opt in.
- **Geo headers are approximate.** VPNs and corporate proxies will mis-detect; the footer selector is the escape hatch, which is why it is not optional.
- **Local dev has no geo header**, so `CA` is only reachable there through the selector or a manual header.

## Scope Boundaries

Out of scope: additional markets or currencies beyond US/CA, language localization, market-specific catalogs and price lists, per-market domains or subfolders, `hreflang`, shipping-rate changes, and adding a test framework.

## Decisions Needed Before Implementation

1. **Selector placement** — footer (recommended, low-friction) or header.
2. **Silent auto-switch or opt-in banner** — silent is recommended given the single-URL design.
3. **CAD rounding rule** in Admin — an Admin setting, not code, but it should be set before this ships.
