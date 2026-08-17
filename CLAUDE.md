# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Shopify **Hydrogen** headless storefront (Hydrogen `2026.4.3`) for **Pawstie**, a pet-products shop, deployed to **Shopify Oxygen** (Cloudflare Workers–style runtime). Built on **React Router 7** (not Remix — see import rule below), Vite, and Tailwind CSS v4.

It started from the Hydrogen "Skeleton" template, but the storefront is now bespoke: home, shop, product, blog, policies, about, and account pages have all been redesigned. `README.md` and `CHANGELOG.md` are still upstream skeleton files — they describe the template, not this shop; don't treat them as documentation of current behavior.

Pushes to any branch deploy to Oxygen via `.github/workflows/oxygen-deployment-1000170383.yml`.

## Commands

```bash
npm run dev         # Local dev server via Shopify CLI + MiniOxygen, runs codegen in watch mode
npm run build       # Production build (shopify hydrogen build --codegen)
npm run preview     # Build then serve the production bundle locally
npm run lint        # ESLint over the repo
npm run test        # node:test over scripts/**/*.test.mjs (see below)
npm run typecheck   # npm test, then react-router typegen && tsc --noEmit
npm run codegen     # Regenerate GraphQL types + React Router route types
```

- **There is no test framework** — `npm test` is the built-in `node:test` runner over `scripts/**/*.test.mjs`, currently one file: `scripts/product-gallery-media.test.mjs`. It is a *source-contract* test: it reads `products.$handle.tsx`, `ProductGallery.tsx`, `structured-data.ts`, and `entry.server.tsx` as text and asserts on their contents (query fields, CSP directives). Editing those files can break it without any behavioral regression. Don't assume broader test coverage exists; confirm with the user before adding a runner or a second framework.
- It runs in two places automatically: a `pretypecheck` hook (so `npm run typecheck` covers it locally) and a CI step in the Oxygen workflow **before** the deploy — a red test blocks the deploy. That gate exists because a CSP regression is invisible in production: beacons and media are silently blocked, nothing 500s.
- **Watch quotation marks in the CSP comments.** `getCspDirectiveSources` scrapes *every* quoted string out of a directive's array block, comments included, so quoting a URL or an error message inside `entry.server.tsx`'s CSP block reads as an extra source and fails the test.
- Node `^22 || ^24` required.
- `.env` holds Shopify storefront credentials and `SESSION_SECRET` (required — context creation throws without it). The Customer Account API (`/account`) needs a public dev domain; see the README step for setup.

## Architecture

### Request flow
`server.ts` is the Oxygen worker entrypoint. Each request:
1. `createHydrogenRouterContext` (`app/lib/context.ts`) builds the Hydrogen context — Storefront client, Customer Account client, cart handler, session, and cache — and passes it to React Router as the load context.
2. `createRequestHandler` delegates routing/rendering to React Router.
3. On a `404`, `storefrontRedirect` checks Shopify-managed URL redirects before returning.
4. Pending session changes are committed via `Set-Cookie` after the response.

### Loaders/actions access Shopify via context
In routes, reach Shopify through the loader/action context, e.g. `context.storefront.query(...)`, `context.customerAccount`, and `context.cart`. To add custom clients (CMS, reviews, Admin API), populate `additionalContext` in `app/lib/context.ts` — entries become available as both `context.propertyName` and `context.get(...)`.

### Content Security Policy
`app/entry.server.tsx` calls `createContentSecurityPolicy` with **hand-tuned directives** beyond the defaults: `mediaSrc` (Shopify CDN + store domain, for hosted product video), `frameSrc` (YouTube + Vimeo embeds), and `scriptSrc` (Shopify + the unpkg `model-viewer` bundle). Any new external media, embed, or script host must be added here or it will be blocked in production — and `scripts/product-gallery-media.test.mjs` asserts these directives, so update the test alongside.

### Routing
File-based via `@react-router/fs-routes` `flatRoutes()`, wrapped in Hydrogen's `hydrogenRoutes()` in `app/routes.ts`. Route files live in `app/routes/` using flat-route dotted naming (e.g. `products.$handle.tsx`, `account.orders.$id.tsx`, `[sitemap.xml].tsx`). Add manual routes to the array in `app/routes.ts`.

Storefront-specific routing decisions:
- **`/shop` (`shop.tsx`) is the catalog page**, not `/collections/all`. `collections.all.tsx` is a bare `301` redirect to `/shop`, and the header nav points at `/shop`. Category chips and sort options are config in `app/lib/shop.ts` — the store has no real category collections, so "categories" are keyword queries run through Storefront product search.
- Custom content routes: `about.tsx` (hand-built, not a Shopify page), `blogs.*`, `policies.*`, `[robots.txt].tsx`, `[sitemap.xml].tsx`, `sitemap.$type.$page[.xml].tsx`.

### GraphQL + codegen (two schemas)
`.graphqlrc.ts` defines **two** projects, and codegen writes matching type files consumed throughout the app:
- **Storefront API** (`default`): documents are inline queries across `app/**` (excluding `app/graphql/`). Types → `storefrontapi.generated.d.ts`.
- **Customer Account API** (`customer`): documents live only in `app/graphql/customer-account/`. Types → `customer-accountapi.generated.d.ts`.

These `*.generated.d.ts` files are build artifacts — never edit them by hand; run `npm run codegen` (or `dev`/`build`, which codegen automatically) after changing any GraphQL document. Shared Storefront fragments (cart, header, footer, recommended products) live in `app/lib/fragments.ts`.

Product fragments are duplicated across `app/lib/fragments.ts`, `app/routes/products.$handle.tsx`, and `app/routes/collections.$handle.tsx`. A field added for a product card (e.g. the POD metafield below) usually has to be added in all three — the files carry "keep in sync" comments saying so.

### Session
`AppSession` (`app/lib/session.ts`) is a cookie-based `HydrogenSession`. Mutating methods (`set`/`unset`) flip `isPending`, which `server.ts` uses to decide when to commit the cookie.

### root.tsx
Loads header/footer data and shop analytics, wraps everything in `PageLayout`, and sets `shouldRevalidate` to skip root-loader revalidation on sub-navigation (perf optimization) except on mutations. It also exposes `origin` (from the request URL) in loader data — canonical URLs and Product JSON-LD derive from it, so there's no hardcoded production domain in the code.

## Styling

Three stylesheets, all linked from `root.tsx`, with distinct roles. Know which one you're in before editing:

| File | Role |
| --- | --- |
| `app/styles/tailwind.css` | Tailwind v4 entry **and** the shadcn theme layer: `@theme inline` tokens, `:root`/`.dark` oklch variables, Figtree font. Generated/managed by shadcn and owned by the user — don't hand-edit it to solve a component problem. |
| `app/styles/reset.css` | Skeleton element defaults, deliberately wrapped in `@layer base` so Tailwind utilities outrank them. Unlayering it would break utilities repo-wide (see the comment at the top of the file). |
| `app/styles/app.css` | Plain hand-written CSS for page/component styling that predates or exceeds utilities (product purchase controls, mock-shop notice, etc.). ~700 lines, class-name based. |

- Tailwind v4 is wired through the `@tailwindcss/vite` plugin (`vite.config.ts`). There is **no `tailwind.config.js`** — all configuration is CSS-first in `tailwind.css`.
- Brand colors are mostly written as arbitrary values (`text-[#00521d]`, `bg-[#effce9]`); the orange CTA color is the `primary` token. Match the surrounding file rather than inventing a token.

## UI components

- `app/components/` is flat for shared/product/cart pieces, with `home/` and `shop/` subfolders for page-specific sections.
- `cn()` from `~/lib/utils` (clsx + tailwind-merge) is the class-merging helper.
- **shadcn is installed but barely used.** `components.json` targets the `base-nova` style on `@base-ui/react` (not Radix), aliased to `~/components/ui`. In practice `app/components/ui/` holds exactly two files: `button.tsx` (scaffolded by shadcn, **currently imported by nothing**) and `Modal.tsx` (hand-written, used by `account.addresses.tsx`). Don't assume a component system exists — most UI is hand-rolled Tailwind.
- Icons are hand-authored SVGs in `app/components/icons.tsx`. `lucide-react` is installed but used in a single file (`ProductForm.tsx`); prefer `icons.tsx` for new icons unless matching that file.

## Print-on-demand personalization

Products flagged for personalization drive an extra checkout step. The flow:
1. The Storefront queries alias a metafield as `printOnDemand: metafield(namespace: "custom", key: "print_on_demand")` — present in `app/lib/fragments.ts`, `products.$handle.tsx`, and `collections.$handle.tsx`.
2. `isPrintOnDemand()` in `app/components/ProductPodBadge.tsx` reads it (string `'true'`), and `ProductPodBadge` renders the badge on cards and the PDP.
3. `ProductForm` gates add-to-cart behind a nameplate form and attaches cart line attributes: `Pet name`, `Phone number`, and `_pod`.
4. `CartLineItem` renders line attributes as "Personalization", **filtering out any key starting with `_`** — that underscore prefix is the convention for internal, non-displayed attributes.

## SEO

- `app/lib/seo.ts` — `metaDescription()` clips Shopify body text to a ~155-char sentence.
- `app/lib/structured-data.ts` — `productJsonLd()`. It deliberately omits `aggregateRating` and `priceValidUntil` (no review source; a stale date reads as an expired offer) and returns `null` rather than a partial object. Read the doc comment before changing it — the omissions are answers to Search Console errors, not oversights.
- Canonical URLs come from the root loader's `origin`; `robots.txt` and the sitemap routes are custom.

## Critical conventions

- **React Router, not Remix.** Import routing hooks/components from `react-router` (e.g. `useLoaderData`, `Link`, `Form`). Never import from `@remix-run/*`, and **never** from `react-router-dom` — note that `react-router-dom` *is* an installed dependency, so a wrong import resolves and type-checks cleanly instead of failing loudly. Nothing in `app/` imports it today; keep it that way. See `.cursor/rules/hydrogen-react-router.mdc` for the full Remix→React Router package mapping.
- **Path alias:** `~/*` → `app/*`.
- `build.assetsInlineLimit: 0` in `vite.config.ts` is intentional — keeps assets un-inlined so a strict CSP works. Don't change without reason.

## Reference docs

- `guides/` — reference docs for existing skeleton features (search, predictive search).
- `docs/superpowers/specs/` and `docs/superpowers/plans/` — dated design specs and implementation plans for features already shipped (hero, new arrivals, shop page, product details, product gallery video, cart drawer). These record *why* a design landed the way it did; check for a matching spec before redesigning one of these areas.
- `AGENTS.md` is a one-line `@CLAUDE.md` include — keep guidance here, not there.
