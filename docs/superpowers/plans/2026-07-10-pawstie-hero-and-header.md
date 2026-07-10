# Pawstie Hero Section + Header Re-skin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Pawstie homepage hero (headline, three peeking animals, three stat/CTA panels) matching the design mockups, and re-skin the global header to the pill style — mobile-first and responsive.

**Architecture:** A new self-contained `Hero` component renders at the top of the homepage `<main>` with two internal layouts (a mobile stacked layout and a desktop composition) that share small content sub-components. The existing global `Header` is re-skinned with Tailwind while keeping all its Shopify data wiring. A tiny inline-SVG icon module supplies glyphs to both.

**Tech Stack:** Hydrogen (React Router 7), TypeScript, Tailwind CSS v4 (arbitrary color values), Vite asset imports, `@shopify/hydrogen` (`Money`), shadcn `cn` helper.

## Global Constraints

- **Never edit `app/styles/tailwind.css`.** The user owns their theme.
- Brand **orange** = theme token only: `bg-primary` / `text-primary` / `text-primary-foreground`. Never hardcode an orange hex.
- Design **greens** are applied as **literal Tailwind arbitrary values** written directly in JSX (`bg-[#14421e]`, `text-[#1c4a25]`, `bg-[#a6dd9d]`, `text-[#3f7a48]`, `bg-[#e9f6e1]`, `bg-[#eef7e9]`). Literals only — never build a color class from a runtime variable (Tailwind's JIT must see the literal).
- **Import routing from `react-router`** — never `@remix-run/*` or `react-router-dom`. Path alias `~/*` → `app/*`.
- Import the three animal PNGs from `~/assets/…` (Vite fingerprints them; `assetsInlineLimit: 0` keeps them external — fine).
- **No test runner exists** (per `CLAUDE.md`). "Verify" in every task = `npm run typecheck` + `npm run lint` both clean, plus a visual screenshot check via the dev server (Playwright MCP). Do **not** add a test runner.
- Working palette (fine-tune against the mockups during visual steps):
  | Role | Value |
  |------|-------|
  | Deep green (frame / dark panel) | `#14421e` |
  | Heading text green | `#1c4a25` |
  | Mint card background | `#e9f6e1` |
  | Spring-green panel | `#a6dd9d` |
  | Muted green body text | `#3f7a48` |
  | Pale-mint pill fill | `#eef7e9` |
  | Pill hover fill | `#e2f0da` |

---

## File Structure

- **Create** `app/components/icons.tsx` — inline SVG icon components (paw, search, cart, user, star, plus, arrow-right, menu). One responsibility: presentational glyphs driven by `currentColor`.
- **Create** `app/components/Hero.tsx` — the homepage hero: outer green frame + mint card, a mobile stacked layout, a desktop composition, and shared stat/CTA content pieces.
- **Modify** `app/routes/_index.tsx` — render `<Hero />` above `RecommendedProducts`; delete the `FeaturedCollection` component + its query; prune now-unused imports.
- **Modify** `app/components/Header.tsx` — re-skin markup/classes to the pill design; preserve all data wiring; add cart subtotal; drop the legacy inline `activeLinkStyle`.

---

## Task 1: Icon set

**Files:**
- Create: `app/components/icons.tsx`

**Interfaces:**
- Produces: named components `PawIcon`, `SearchIcon`, `CartIcon`, `UserIcon`, `StarIcon`, `PlusIcon`, `ArrowRightIcon`, `MenuIcon`, each typed `(props: React.SVGProps<SVGSVGElement>) => JSX.Element`. They spread `props` onto `<svg>` and use `currentColor`, so callers control size/color with Tailwind (`className="size-5 text-primary"`).

- [ ] **Step 1: Create the icon module**

Create `app/components/icons.tsx`:

```tsx
import type {SVGProps} from 'react';

type IconProps = SVGProps<SVGSVGElement>;

export function PawIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <circle cx="5.5" cy="10.5" r="2.2" />
      <circle cx="9.5" cy="6.3" r="2.2" />
      <circle cx="14.5" cy="6.3" r="2.2" />
      <circle cx="18.5" cy="10.5" r="2.2" />
      <path d="M12 12.2c-2.9 0-5.2 2-5.2 4.3 0 1.7 1.5 2.8 3.3 2.8.9 0 1.3-.3 1.9-.3s1 .3 1.9.3c1.8 0 3.3-1.1 3.3-2.8 0-2.3-2.3-4.3-5.2-4.3Z" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function CartIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2 3h2.3l2.3 12.4a1.5 1.5 0 0 0 1.5 1.2h9a1.5 1.5 0 0 0 1.5-1.2L21 7H6" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2.5l2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.9l-5.8 3.05 1.1-6.5-4.7-4.6 6.5-.95L12 2.5Z" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: completes with no errors.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors for `app/components/icons.tsx`. (Unused-export warnings won't appear — they're consumed in later tasks; if the linter flags an unused import it's a typo, fix it.)

- [ ] **Step 4: Commit**

```bash
git add app/components/icons.tsx
git commit -m "Add inline SVG icon set for hero and header"
```

---

## Task 2: Scaffold Hero + wire into the homepage

Deliverable: the homepage renders a green-framed mint hero shell (headline only) above the existing Recommended Products; Featured Collection is gone. This gives a live canvas for Tasks 3–4.

**Files:**
- Create: `app/components/Hero.tsx`
- Modify: `app/routes/_index.tsx`

**Interfaces:**
- Produces: `export function Hero(): JSX.Element` — takes no props. Consumed by `_index.tsx`.

- [ ] **Step 1: Create the Hero scaffold**

Create `app/components/Hero.tsx`:

```tsx
function HeroMobile() {
  return (
    <div className="lg:hidden">
      <h1 className="text-center font-heading text-4xl font-extrabold leading-[0.95] tracking-tight text-[#1c4a25] sm:text-5xl">
        Everything
        <br />
        Your Pets Love
      </h1>
    </div>
  );
}

function HeroDesktop() {
  return (
    <div className="relative hidden lg:block">
      <h1 className="text-center font-heading text-[6.5rem] font-extrabold leading-[0.9] tracking-tight text-[#1c4a25] xl:text-[8rem]">
        Everything
        <br />
        Your Pets Love
      </h1>
    </div>
  );
}

export function Hero() {
  return (
    <section className="bg-[#14421e] p-3 sm:p-4 lg:p-6">
      <div className="overflow-hidden rounded-[2.5rem] bg-[#e9f6e1] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <HeroMobile />
        <HeroDesktop />
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Wire Hero into the homepage and remove Featured Collection**

Replace the entire contents of `app/routes/_index.tsx` with:

```tsx
import {Await, useLoaderData} from 'react-router';
import type {Route} from './+types/_index';
import {Suspense} from 'react';
import type {RecommendedProductsQuery} from 'storefrontapi.generated';
import {ProductItem} from '~/components/ProductItem';
import {MockShopNotice} from '~/components/MockShopNotice';
import {Hero} from '~/components/Hero';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Pawstie | Home'}];
};

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. The hero is static,
 * so there are no above-the-fold Storefront queries here.
 */
function loadCriticalData({context}: Route.LoaderArgs) {
  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error: Error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  return {
    recommendedProducts,
  };
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="home">
      {data.isShopLinked ? null : <MockShopNotice />}
      <Hero />
      <RecommendedProducts products={data.recommendedProducts} />
    </div>
  );
}

function RecommendedProducts({
  products,
}: {
  products: Promise<RecommendedProductsQuery | null>;
}) {
  return (
    <section
      className="recommended-products"
      aria-labelledby="recommended-products"
    >
      <h2 id="recommended-products">Recommended Products</h2>
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {(response) => (
            <div className="recommended-products-grid">
              {response
                ? response.products.nodes.map((product) => (
                    <ProductItem key={product.id} product={product} />
                  ))
                : null}
            </div>
          )}
        </Await>
      </Suspense>
      <br />
    </section>
  );
}

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
` as const;
```

- [ ] **Step 3: Regenerate types, typecheck, lint**

The removed query changes generated types.

Run: `npm run codegen`
Expected: regenerates `storefrontapi.generated.d.ts` without the `FeaturedCollection` types; no errors.

Run: `npm run typecheck`
Expected: no errors. (If tsc complains that a PNG import has no type, confirm `env.d.ts` still starts with `/// <reference types="vite/client" />` — it does in this repo.)

Run: `npm run lint`
Expected: no errors — in particular no `no-unused-vars` for `Link`/`Image`/`FeaturedCollectionFragment` (all removed).

- [ ] **Step 4: Visual check**

Start the dev server in the background: `npm run dev` (serves on `http://localhost:3000`).
Using the Playwright MCP: navigate to `http://localhost:3000/`, set viewport to 390×844, and screenshot. Confirm: a deep-green frame around a mint rounded card containing the "Everything / Your Pets Love" headline, with the Recommended Products section below. No console errors.

- [ ] **Step 5: Commit**

```bash
git add app/components/Hero.tsx app/routes/_index.tsx storefrontapi.generated.d.ts
git commit -m "Render hero shell on homepage; drop Featured Collection"
```

---

## Task 3: Hero mobile layout (stacked blocks + shared content)

Deliverable: the mobile hero matches the mockup — three stacked blocks in the required order (golden retriever → dachshund → cat), each animal peeking over its colored panel, with the shared stat/CTA content.

**Files:**
- Modify: `app/components/Hero.tsx`

**Interfaces:**
- Consumes: icon components from Task 1 (`PawIcon`, `PlusIcon`, `StarIcon`, `ArrowRightIcon`), `Link` from `react-router`, the three PNGs from `~/assets`.
- Produces: internal `ClientsStat`, `RatingStat`, `CtaContent` components reused by Task 4.

- [ ] **Step 1: Replace `app/components/Hero.tsx` with the full mobile implementation**

The `HeroDesktop` stub is kept as-is from Task 2 (Task 4 fills it in). Replace the file with:

```tsx
import {Link} from 'react-router';
import goldenRetriever from '~/assets/img-golden-retriever.png';
import dachshund from '~/assets/img-dachshund.png';
import cat from '~/assets/img-cat.png';
import {
  ArrowRightIcon,
  PawIcon,
  PlusIcon,
  StarIcon,
} from '~/components/icons';

const CTA_HREF = '/collections/all';

function ClientsStat() {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="font-heading text-4xl font-extrabold text-[#1c4a25] lg:text-5xl">
          98K+
        </span>
        <span className="flex items-center">
          <span className="grid size-10 place-items-center rounded-full bg-white text-primary ring-2 ring-white">
            <PawIcon className="size-5" />
          </span>
          <span className="-ml-3 grid size-10 place-items-center rounded-full bg-[#14421e] text-white ring-2 ring-[#a6dd9d]">
            <PlusIcon className="size-4" />
          </span>
        </span>
      </div>
      <p className="mt-3 max-w-[16rem] font-medium text-[#3f7a48]">
        Happy Clients and Their Pets Who Love Our Products
      </p>
    </div>
  );
}

function RatingStat() {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="font-heading text-4xl font-extrabold text-[#1c4a25] lg:text-5xl">
          4.6
        </span>
        <StarIcon className="size-8 text-primary" />
      </div>
      <p className="mt-3 max-w-[16rem] font-medium text-[#3f7a48]">
        Based on Reviews from Happy Pet Owners Worldwide
      </p>
    </div>
  );
}

function CtaContent() {
  return (
    <div>
      <h2 className="font-heading text-2xl font-bold leading-tight text-white lg:text-3xl">
        Best Products
        <br />
        for Your Pet
      </h2>
      <Link
        to={CTA_HREF}
        className="mt-5 inline-flex items-center gap-3 rounded-full bg-primary py-2 pl-6 pr-2 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        Explore Products
        <span className="grid size-9 place-items-center rounded-full bg-white text-primary">
          <ArrowRightIcon className="size-4" />
        </span>
      </Link>
    </div>
  );
}

function HeroMobile() {
  return (
    <div className="lg:hidden">
      {/* Block 1 — Golden retriever */}
      <div>
        <h1 className="text-center font-heading text-4xl font-extrabold leading-[0.95] tracking-tight text-[#1c4a25] sm:text-5xl">
          Everything
          <br />
          Your Pets Love
        </h1>
        <img
          src={goldenRetriever}
          alt=""
          className="relative z-10 mx-auto -mb-8 w-4/5 max-w-sm"
        />
        <div className="flex flex-col items-center rounded-[2rem] bg-[#14421e] px-6 pb-8 pt-12 text-center">
          <CtaContent />
        </div>
      </div>

      {/* Block 2 — Dachshund */}
      <div className="mt-10">
        <img
          src={dachshund}
          alt=""
          className="relative z-10 mx-auto -mb-8 w-4/5 max-w-sm"
        />
        <div className="rounded-[2rem] bg-[#a6dd9d] px-6 pb-8 pt-12">
          <ClientsStat />
        </div>
      </div>

      {/* Block 3 — Cat */}
      <div className="mt-10">
        <img
          src={cat}
          alt=""
          className="relative z-10 mx-auto -mb-8 w-3/5 max-w-[15rem]"
        />
        <div className="rounded-[2rem] bg-[#a6dd9d] px-6 pb-8 pt-12">
          <RatingStat />
        </div>
      </div>
    </div>
  );
}

function HeroDesktop() {
  return (
    <div className="relative hidden lg:block">
      <h1 className="text-center font-heading text-[6.5rem] font-extrabold leading-[0.9] tracking-tight text-[#1c4a25] xl:text-[8rem]">
        Everything
        <br />
        Your Pets Love
      </h1>
    </div>
  );
}

export function Hero() {
  return (
    <section className="bg-[#14421e] p-3 sm:p-4 lg:p-6">
      <div className="overflow-hidden rounded-[2.5rem] bg-[#e9f6e1] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <HeroMobile />
        <HeroDesktop />
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npm run typecheck`
Expected: no errors.

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Visual check + tune the overlap**

With `npm run dev` running, use the Playwright MCP at viewport 390×844 on `http://localhost:3000/` and screenshot. Verify against the mobile mockup:
- Order top→bottom: headline+retriever+dark CTA panel, then dachshund+`98K+` panel, then cat+`4.6` panel.
- Each animal's paws overlap the top edge of its panel (the "peeking over a ledge" look). If the gap looks wrong, adjust the image `-mb-8` and the panel `pt-12` together (more negative margin + more top padding = deeper peek). Keep changes to those utility values only.
- The orange **Explore Products** pill and orange star/paw use the theme orange.

- [ ] **Step 4: Commit**

```bash
git add app/components/Hero.tsx
git commit -m "Implement mobile hero layout with peeking animals and panels"
```

---

## Task 4: Hero desktop composition

Deliverable: at `lg+` the hero matches the desktop mockup — big centered headline, a three-column band (spring / deep-green CTA / spring), and the three animals overlapping the band with the golden retriever centered and largest.

**Files:**
- Modify: `app/components/Hero.tsx` (replace only the `HeroDesktop` function)

**Interfaces:**
- Consumes: `ClientsStat`, `RatingStat`, `CtaContent`, and the three image imports already present in the file from Task 3.

- [ ] **Step 1: Replace the `HeroDesktop` function**

In `app/components/Hero.tsx`, replace the entire `HeroDesktop` function (the stub) with:

```tsx
function HeroDesktop() {
  return (
    <div className="relative hidden lg:block">
      <h1 className="text-center font-heading text-[6.5rem] font-extrabold leading-[0.9] tracking-tight text-[#1c4a25] xl:text-[8rem]">
        Everything
        <br />
        Your Pets Love
      </h1>

      {/* Bottom band: three columns */}
      <div className="mt-8 grid grid-cols-3 gap-5">
        <div className="rounded-[2rem] bg-[#a6dd9d] px-8 pb-10 pt-44">
          <ClientsStat />
        </div>
        <div className="flex flex-col items-center rounded-[2rem] bg-[#14421e] px-8 pb-10 pt-52 text-center">
          <CtaContent />
        </div>
        <div className="flex flex-col items-end rounded-[2rem] bg-[#a6dd9d] px-8 pb-10 pt-44 text-right">
          <RatingStat />
        </div>
      </div>

      {/* Animals overlapping the band (tune positions in Step 3) */}
      <img
        src={dachshund}
        alt=""
        className="pointer-events-none absolute bottom-40 left-0 z-10 w-[27%]"
      />
      <img
        src={goldenRetriever}
        alt=""
        className="pointer-events-none absolute bottom-20 left-1/2 z-20 w-[36%] -translate-x-1/2"
      />
      <img
        src={cat}
        alt=""
        className="pointer-events-none absolute bottom-40 right-0 z-10 w-[24%]"
      />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npm run typecheck`
Expected: no errors.

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Visual check + tune positions**

With `npm run dev` running, use the Playwright MCP at viewport 1440×900 on `http://localhost:3000/` and screenshot. Compare to the desktop mockup and tune **only** the arbitrary sizing/position utilities on the three `<img>` tags and the band's `pt-*` values so that:
- The golden retriever is centered, largest, and overlaps the dark-green CTA panel; its head sits up near the headline.
- The dachshund overlaps the top of the left (`98K+`) panel; the cat overlaps the top of the right (`4.6`) panel.
- Each panel's stat content sits in the panel's lower area, clear of the animal above it (increase that panel's `pt-*` if the animal overlaps the text).
- Nothing overflows the mint card horizontally; the card clips via its existing `overflow-hidden`.

Then screenshot at 820×1180 (tablet) and confirm the layout is still the mobile stack (it should be, since desktop is `lg+`) and reads well with no overflow.

- [ ] **Step 4: Commit**

```bash
git add app/components/Hero.tsx
git commit -m "Implement desktop hero composition with overlapping animals"
```

---

## Task 5: Header re-skin

Deliverable: the global header matches the pill design — paw logo + store name, data-driven nav (active link emphasized), and search / cart (icon + count + subtotal) / account pills. All existing behaviors (asides, `/account`, optimistic cart) preserved. No 4-star badge.

**Files:**
- Modify: `app/components/Header.tsx` (full rewrite of markup; data wiring preserved)

**Interfaces:**
- Consumes: `useAside` (`~/components/Aside`), `cn` (`~/lib/utils`), icons from Task 1 (`CartIcon`, `MenuIcon`, `PawIcon`, `SearchIcon`, `UserIcon`), `Money` from `@shopify/hydrogen`, and the existing `HeaderQuery` / `CartApiQueryFragment` types.
- Produces: unchanged public exports `Header` and `HeaderMenu` (same props as before) so `PageLayout.tsx` needs no changes.

- [ ] **Step 1: Replace the entire contents of `app/components/Header.tsx`**

```tsx
import {Suspense} from 'react';
import {Await, NavLink, useAsyncValue} from 'react-router';
import {
  type CartViewPayload,
  Money,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {HeaderQuery, CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {cn} from '~/lib/utils';
import {
  CartIcon,
  MenuIcon,
  PawIcon,
  SearchIcon,
  UserIcon,
} from '~/components/icons';

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
}

type Viewport = 'desktop' | 'mobile';

const pillClass =
  'inline-flex items-center justify-center rounded-full bg-[#eef7e9] text-[#1c4a25] transition-colors hover:bg-[#e2f0da]';

function navLinkClass({
  isActive,
}: {
  isActive: boolean;
  isPending: boolean;
}) {
  return cn(
    'font-medium text-[#1c4a25]/60 transition-colors hover:text-[#1c4a25]',
    isActive && 'font-bold text-[#1c4a25]',
  );
}

export function Header({header, cart, publicStoreDomain}: HeaderProps) {
  const {shop, menu} = header;
  return (
    <header className="flex items-center justify-between gap-4 bg-background px-4 py-3 sm:px-6 lg:px-10">
      <NavLink
        prefetch="intent"
        to="/"
        end
        className="flex items-center gap-2"
      >
        <PawIcon className="size-8 text-primary" />
        <span className="font-heading text-xl font-bold text-[#1c4a25]">
          {shop.name}
        </span>
      </NavLink>
      <HeaderMenu
        menu={menu}
        viewport="desktop"
        primaryDomainUrl={header.shop.primaryDomain.url}
        publicStoreDomain={publicStoreDomain}
      />
      <HeaderCtas cart={cart} />
    </header>
  );
}

export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
}: {
  menu: HeaderProps['header']['menu'];
  primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
  viewport: Viewport;
  publicStoreDomain: HeaderProps['publicStoreDomain'];
}) {
  const {close} = useAside();
  const className =
    viewport === 'desktop'
      ? 'hidden items-center gap-7 md:flex'
      : 'flex flex-col gap-4 p-6 text-lg';

  return (
    <nav className={className} role="navigation">
      <NavLink
        end
        onClick={close}
        prefetch="intent"
        className={navLinkClass}
        to="/"
      >
        Home
      </NavLink>
      {(menu || FALLBACK_HEADER_MENU).items.map((item) => {
        if (!item.url) return null;

        // if the url is internal, we strip the domain
        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;
        return (
          <NavLink
            className={navLinkClass}
            end
            key={item.id}
            onClick={close}
            prefetch="intent"
            to={url}
          >
            {item.title}
          </NavLink>
        );
      })}
    </nav>
  );
}

function HeaderCtas({cart}: Pick<HeaderProps, 'cart'>) {
  return (
    <nav className="flex items-center gap-2 md:gap-3" role="navigation">
      <SearchToggle />
      <CartToggle cart={cart} />
      <AccountLink />
      <HeaderMenuMobileToggle />
    </nav>
  );
}

function AccountLink() {
  return (
    <NavLink
      prefetch="intent"
      to="/account"
      className={cn(pillClass, 'size-11')}
      aria-label="Account"
    >
      <UserIcon className="size-5" />
    </NavLink>
  );
}

function HeaderMenuMobileToggle() {
  const {open} = useAside();
  return (
    <button
      className={cn(pillClass, 'size-11 md:hidden')}
      onClick={() => open('mobile')}
      aria-label="Open menu"
    >
      <MenuIcon className="size-5" />
    </button>
  );
}

function SearchToggle() {
  const {open} = useAside();
  return (
    <button
      className={cn(pillClass, 'size-11')}
      onClick={() => open('search')}
      aria-label="Search"
    >
      <SearchIcon className="size-5" />
    </button>
  );
}

function CartBadge({
  count,
  subtotal,
}: {
  count: number;
  subtotal: CartApiQueryFragment['cost']['subtotalAmount'] | null;
}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <a
      href="/cart"
      onClick={(e) => {
        e.preventDefault();
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        } as CartViewPayload);
      }}
      className={cn(pillClass, 'h-11 gap-2 pl-2 pr-4')}
      aria-label={`Cart, ${count} items`}
    >
      <span className="relative grid size-8 place-items-center">
        <CartIcon className="size-5" />
        <span className="absolute -right-1 -top-1 grid size-4 min-w-4 place-items-center rounded-full bg-[#14421e] px-1 text-[10px] font-bold leading-none text-white">
          {count}
        </span>
      </span>
      {subtotal ? (
        <Money data={subtotal} className="text-sm font-semibold" />
      ) : null}
    </a>
  );
}

function CartToggle({cart}: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartBadge count={0} subtotal={null} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  return (
    <CartBadge
      count={cart?.totalQuantity ?? 0}
      subtotal={cart?.cost?.subtotalAmount ?? null}
    />
  );
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      resourceId: null,
      tags: [],
      title: 'Collections',
      type: 'HTTP',
      url: '/collections',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      resourceId: null,
      tags: [],
      title: 'Blog',
      type: 'HTTP',
      url: '/blogs/journal',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      resourceId: null,
      tags: [],
      title: 'Policies',
      type: 'HTTP',
      url: '/policies',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      resourceId: 'gid://shopify/Page/92591030328',
      tags: [],
      title: 'About',
      type: 'PAGE',
      url: '/pages/about',
      items: [],
    },
  ],
};
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors. If tsc reports that `subtotal`'s type doesn't match `Money`'s `data` prop, change the `CartBadge` prop type to `subtotal: CartApiQueryFragment['cost']['subtotalAmount'] | null | undefined` and keep the `subtotal ?` guard (do not add a GraphQL field).

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors. In particular, no `no-unused-vars` — `isLoggedIn` is intentionally not destructured in `Header` (it remains in `HeaderProps` because `PageLayout` passes it), and the legacy `activeLinkStyle` is gone.

- [ ] **Step 4: Visual check**

With `npm run dev` running, use the Playwright MCP on `http://localhost:3000/`:
- At 1440×900: header shows paw + store name on the left, nav links centered (Home bold/active), and search / cart / account pills on the right. Hover a nav link → darkens.
- At 390×844: nav links are hidden; the hamburger pill shows; tapping it opens the mobile menu aside (which renders `HeaderMenu` mobile). Search and cart pills open their asides.
- Add an item to the cart (or with a linked store) and confirm the cart pill shows the count badge and subtotal.

- [ ] **Step 5: Commit**

```bash
git add app/components/Header.tsx
git commit -m "Re-skin header to pill design with cart subtotal"
```

---

## Task 6: Cross-breakpoint QA pass

Deliverable: verified, polished hero + header across mobile, tablet, and desktop with clean lint/typecheck. This task is where remaining visual nits from the mockups get fixed.

**Files:**
- Modify: `app/components/Hero.tsx` and/or `app/components/Header.tsx` (only if the QA finds issues)

- [ ] **Step 1: Screenshot sweep**

With `npm run dev` running, use the Playwright MCP to screenshot `http://localhost:3000/` at 390×844, 768×1024, 1024×768, 1280×800, and 1440×900. For each, compare to the mockups and note any issues (overflow, overlap covering text, misaligned panels, headline wrapping oddly).

- [ ] **Step 2: Fix issues**

Apply targeted fixes, changing only Tailwind utility values (spacing, sizing, positions, font sizes) — never `tailwind.css`, never the color strategy (greens stay arbitrary literals; orange stays `primary`). Re-screenshot the affected width to confirm.

- [ ] **Step 3: Final typecheck + lint**

Run: `npm run typecheck`
Expected: no errors.

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit (if any fixes were made)**

```bash
git add app/components/Hero.tsx app/components/Header.tsx
git commit -m "Polish hero and header across breakpoints"
```

---

## Self-Review

**Spec coverage:**
- Hero headline + three animals → Tasks 2–4. ✅
- Three stat/CTA panels (98K+, Best Products + CTA, 4.6) → Task 3 (content) + Tasks 3/4 (layout). ✅
- Mobile order retriever→dachshund→cat → Task 3 `HeroMobile`. ✅
- Desktop composition with centered/largest retriever → Task 4. ✅
- Header re-skin, data-driven, pills, cart subtotal, no 4-star badge → Task 5. ✅
- Keep Recommended Products, drop Featured Collection → Task 2. ✅
- Don't touch `tailwind.css`; greens arbitrary; orange `primary` → Global Constraints + enforced in every task. ✅
- Explore Products → `/collections/all` → Task 3 `CTA_HREF`. ✅
- Out-of-scope items (Cozy Cat House, TikTok/YouTube card, New Arrivals, 4-star badge) → never introduced. ✅

**Placeholder scan:** No TBD/TODO; the `pt-*`/`-mb-*`/`w-[%]`/`bottom-*` values are concrete starting values with explicit tuning steps (not placeholders). ✅

**Type consistency:** `ClientsStat` / `RatingStat` / `CtaContent` defined in Task 3 and reused verbatim in Task 4. Icon names match Task 1's exports. `Hero` (no props) matches its use in Task 2's `_index.tsx`. `HeaderMenu`/`Header` keep their original prop shapes so `PageLayout` is untouched. `CartBadge` prop `subtotal` type is consistent between definition and both call sites (`CartBanner`, `CartToggle` fallback). ✅
