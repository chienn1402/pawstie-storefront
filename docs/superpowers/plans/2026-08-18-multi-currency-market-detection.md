# Multi-Currency US/CA Implementation Plan

> Steps use checkbox (`- [ ]`) syntax for tracking. Work the tasks in order; each one leaves the storefront in a shippable state.

**Goal:** Resolve a supported market per request (`US` or `CA`) and carry it through pricing, cart, checkout, and analytics, without changing behavior for US visitors and without introducing market URLs.

**Architecture:** One pure resolver (`app/lib/i18n.ts`) decides the country from session → `oxygen-buyer-country` header → `US`. `createHydrogenRouterContext` feeds that value to `storefront.i18n`, which every `@inContext` query already consumes. A footer form posts to a `country` resource route that persists the choice in the session, syncs `cart.buyerIdentity.countryCode`, and redirects so every loader re-runs.

**Tech Stack:** Shopify Hydrogen 2026.4.3, Storefront GraphQL API, React Router 7, TypeScript 5.9, Tailwind CSS 4, Node.js 22 native test runner.

**Design doc:** `docs/superpowers/specs/2026-08-18-multi-currency-market-detection-design.md`

**Assumptions carried from the spec's open decisions** — change these before starting if they are wrong:
1. Selector lives in the **footer**, in the existing bottom bar next to the copyright line.
2. Detection **switches silently**; no interstitial or banner. The URL never changes, so this is not a redirect.
3. The CAD **rounding rule is set in Admin** by the merchant. It is not a code task and does not block this work.

## Global Constraints

- Import routing APIs from `react-router` — never `@remix-run/*`, never `react-router-dom` (it is installed and would resolve silently).
- Do not edit `storefrontapi.generated.d.ts` or `customer-accountapi.generated.d.ts`; regenerate with `npm run codegen`.
- Do not hand-edit `app/styles/tailwind.css`. Footer styling uses arbitrary brand values matching the surrounding file (`#c3edc0`, `#a4e8aa`, `#003e15`).
- Add no test dependency and no second test framework. `npm test` stays `node --test` over `scripts/**/*.test.mjs`.
- Add no public `Cache-Control` to any HTML route. HTML now varies by geo header and cookie.
- Supported countries are exactly `US` and `CA`. Everything else resolves to `US`.
- No new GraphQL fields are required — `buyerIdentity { countryCode }` is already in `CART_QUERY_FRAGMENT`.

## File Structure

- Create `app/lib/i18n.ts`: supported-country constants and `resolveCountry`.
- Create `app/routes/country.tsx`: action-only resource route for the switch.
- Create `app/components/CountrySelector.tsx`: the footer form.
- Create `scripts/market-detection.test.mjs`: source-contract checks for the above.
- Modify `app/lib/context.ts`: replace the hardcoded `i18n` object.
- Modify `app/root.tsx`: expose the resolved `country` in loader data.
- Modify `app/components/Footer.tsx`: render the selector in the bottom bar.
- Modify `app/routes/cart.tsx`: sync buyer identity when a cart is created.

---

### Task 1: Country Resolution Module

**Files:**
- Create: `app/lib/i18n.ts`
- Create: `scripts/market-detection.test.mjs`

**Interfaces:**
- Consumes: a `Request` and an `AppSession`-shaped object exposing `get`.
- Produces: `SUPPORTED_COUNTRIES`, `DEFAULT_COUNTRY`, `LANGUAGE`, `COUNTRY_SESSION_KEY`, `isSupportedCountry()`, `resolveCountry()`.

- [ ] **Step 1: Write the failing contract test**

Create `scripts/market-detection.test.mjs` in the style of `scripts/product-gallery-media.test.mjs` — read the sources as text and assert on their contents. Assert that `app/lib/i18n.ts` exists and names both `'US'` and `'CA'`, that `resolveCountry` reads `oxygen-buyer-country`, and that `app/lib/context.ts` no longer contains the literal `country: 'US'`. Run `npm test` and confirm it fails.

- [ ] **Step 2: Implement the resolver**

`resolveCountry({request, session})` applies, in order: a supported value at `COUNTRY_SESSION_KEY` in the session; a supported value from `request.headers.get('oxygen-buyer-country')` (uppercased, may be absent or empty — Oxygen omits it when geo data is unavailable, and MiniOxygen never sets it); otherwise `DEFAULT_COUNTRY`.

Type the return as Hydrogen's `CountryCode` so `createHydrogenContext` accepts it without a cast. Keep the module free of Hydrogen imports beyond that type, and free of side effects.

- [ ] **Step 3: Confirm the test passes for the i18n half**

`npm test` — the `context.ts` assertion still fails, which is correct; Task 2 closes it.

---

### Task 2: Wire Resolution Into the Hydrogen Context

**Files:**
- Modify: `app/lib/context.ts`

**Interfaces:**
- Consumes: `resolveCountry` from `~/lib/i18n`.
- Produces: `storefront.i18n.country` reflecting the request, for every loader and every `@inContext` query.

- [ ] **Step 1: Replace the hardcoded locale**

At `app/lib/context.ts:56`, swap `i18n: {language: 'EN', country: 'US'}` for the resolved value. The session is already awaited above, so no reordering is needed. Replace the stale skeleton comment ("Or detect from URL path based on locale subpath…") with one line stating the actual precedence.

- [ ] **Step 2: Verify propagation**

`npm test` (now fully green), then `npm run typecheck`. Start `npm run dev` and confirm a plain request still renders USD everywhere — this task must be a no-op for US traffic.

---

### Task 3: Country Switch Route

**Files:**
- Create: `app/routes/country.tsx`
- Modify: `scripts/market-detection.test.mjs`

**Interfaces:**
- Consumes: `POST` with `country` and `redirectTo` form fields.
- Produces: a `303` to `redirectTo`, a pending session write, and a re-priced cart.

- [ ] **Step 1: Extend the contract test**

Assert that `app/routes/country.tsx` validates against the supported set, calls `updateBuyerIdentity`, and returns a `303`. Confirm it fails.

- [ ] **Step 2: Implement the action**

Action-only route, no default export, no loader. Read `country` and `redirectTo` from the form. Reject an unsupported `country` with a `400` rather than silently defaulting — a bad value here means a bug, not a shopper.

Accept only same-origin relative paths for `redirectTo` (must start with `/` and not `//`), falling back to `/`; an open redirect off a form post is not worth the convenience.

Write the country to the session (which flips `isPending`, and `server.ts` commits the cookie on the way out). If a cart exists, call `context.cart.updateBuyerIdentity({countryCode})` and merge the returned cart headers with the redirect headers so the cart id cookie is not dropped.

Return `303` to `redirectTo`. A full-document response is required: `root.tsx`'s `shouldRevalidate` skips root-loader revalidation on sub-navigation, so a client-side transition would leave the header and footer priced in the old currency.

- [ ] **Step 3: Verify by hand**

`curl -i -X POST` the route with `country=CA` and confirm a `303`, a `Set-Cookie`, and that a follow-up request carrying the cookie returns CAD prices.

---

### Task 4: Footer Selector

**Files:**
- Create: `app/components/CountrySelector.tsx`
- Modify: `app/root.tsx`
- Modify: `app/components/Footer.tsx`

**Interfaces:**
- Consumes: `country` from the root loader via `useRouteLoaderData<RootLoader>('root')`; the current path via `useLocation()`.
- Produces: a form posting to `/country`.

- [ ] **Step 1: Expose the country in root loader data**

Add `country: args.context.storefront.i18n.country` to the root loader's return, alongside the existing `origin` and `publicStoreDomain`. The value is already read two lines away for the consent config (`app/root.tsx:99`).

- [ ] **Step 2: Build the selector**

A `Form method="post" action="/country"` with a labelled `<select>` offering "United States (USD)" and "Canada (CAD)", a hidden `redirectTo` carrying `pathname + search`, and a visible submit button.

Read the current country with `useRouteLoaderData<RootLoader>('root')` — the pattern already used at `app/root.tsx:155` — rather than threading a prop through `PageLayout`. Do not auto-submit on change; a `<select>` that navigates on change is hostile to keyboard and screen-reader users, and the submit button is what makes this work without JavaScript.

Style it against the footer's dark green ground using the existing `linkClass` colors, and give the button the same `focus-visible` treatment as the surrounding links.

- [ ] **Step 3: Render it in the bottom bar**

Place it in the `border-t border-white/15` row at `app/components/Footer.tsx:79`, in the flex row with the copyright and tagline. Leave `LandingFooter` untouched — the landing pages deliberately strip chrome.

- [ ] **Step 4: Verify**

`npm run dev`, switch to Canada, and confirm prices change on the home page, `/shop`, and a product page; confirm the choice survives a reload and that switching back to the United States restores USD.

---

### Task 5: Cart and Checkout Consistency

**Files:**
- Modify: `app/routes/cart.tsx`
- Modify: `scripts/market-detection.test.mjs`

**Interfaces:**
- Consumes: the resolved country and the cart's current `buyerIdentity.countryCode`.
- Produces: a cart whose buyer identity matches the browsing context before checkout.

- [ ] **Step 1: Extend the contract test**

Assert that `app/routes/cart.tsx` syncs buyer identity on the `LinesAdd` path. Confirm it fails.

- [ ] **Step 2: Sync on cart creation**

`LinesAdd` is where a cart first comes into existence, and a cart created before any switch keeps whatever country it was born with. After `cart.addLines`, compare the returned `buyerIdentity.countryCode` to `context.storefront.i18n.country` and call `cart.updateBuyerIdentity({countryCode})` when they differ.

Keep this to a single small helper shared with the country route rather than duplicating the comparison. Do not call it unconditionally — an extra cart mutation on every add-to-cart is a wasted round trip on the hottest path in the store.

- [ ] **Step 3: Verify end to end**

As a Canadian session: add to cart, confirm the cart drawer and `/cart` show CAD, follow `checkoutUrl`, and confirm `checkout.pawstie.com` presents CAD. Repeat as a US session and confirm USD. Then add to cart as US, switch to Canada, and confirm the existing cart re-prices.

---

### Task 6: Guardrails and Full Verification

**Files:**
- Modify: `CLAUDE.md`
- Modify: `scripts/market-detection.test.mjs`

- [ ] **Step 1: Assert the caching invariant**

Add a check that no route under `app/routes/` sets a public `Cache-Control` on an HTML response, excluding the known country-independent exceptions (`[robots.txt].tsx`, `[sitemap.xml].tsx`, `sitemap.$type.$page[.xml].tsx`) and `account.tsx`'s `no-store`. This is the regression that would silently serve one country's prices to the other, and like the CSP directives it fails invisibly in production.

- [ ] **Step 2: Document the convention**

Add a short subsection to `CLAUDE.md` covering: the two supported markets, where the country is resolved, the rule that HTML must not be publicly cached while it varies by geo, and the note that Storefront sub-request caching is safe because `$country` is part of the query variables and therefore of the cache key.

- [ ] **Step 3: Run the full gate**

`npm run typecheck` (runs `npm test` via `pretypecheck`), `npm run lint`, `npm run build`.

- [ ] **Step 4: Verify detection without a cookie**

Against `npm run preview`: `curl -H 'oxygen-buyer-country: CA'` and confirm CAD in the HTML; `curl` with no header and confirm USD. This is the only check of the header path, since the selector bypasses it.

- [ ] **Step 5: Verify the deploy**

After deploying, verify against the served response rather than the asset hash — grep the returned HTML for the currency itself.

- [ ] **Step 6: Verify analytics**

From a CA session, confirm `CAD` on `PageView`, `ViewContent`, and `AddToCart` in both the browser pixel and the CAPI payloads for Meta and TikTok. No code change is expected — `getShopAnalytics` derives currency from `localization.country.currency.isoCode`, and both `api.meta-events.tsx` and `api.tiktok-events.tsx` pass the client's params straight through — so this step is confirmation that the pass-through holds.

---

## Out of Scope

Additional markets or currencies, language localization, market-specific catalogs and price lists, per-market domains or subfolders, `hreflang`, shipping-rate changes, and adding a test framework.
