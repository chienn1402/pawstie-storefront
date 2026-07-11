# New Arrivals Section + Decorated Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-style the homepage product section into a hero-matching "New Arrivals" band, and give the shared product card a branded decorated look site-wide.

**Architecture:** Two focused changes. Task 1 rewrites the shared `ProductItem` card (rendered on homepage, collections, and search) into a rounded branded panel with an opt-in "New" badge, and folds its image sizing out of `app.css`. Task 2 rewrites the homepage's `RecommendedProducts` function into a `NewArrivals` section — a full-bleed mint band with a display heading, paw accent, responsive "Explore all" pill, and a Tailwind grid — and removes the superseded grid CSS. Task 2 consumes the `isNew` prop that Task 1 adds, so Task 1 lands first.

**Tech Stack:** Hydrogen 2026.4.3, React Router 7 (import from `react-router`), Tailwind CSS v4 (arbitrary color values + theme tokens), `@shopify/hydrogen` `<Image>` / `<Money>`.

## Global Constraints

- **Do not edit `app/styles/tailwind.css`.** Brand orange = theme token `--primary` (`bg-primary` / `text-primary-foreground`). Design greens are NOT theme tokens — write them as **literal** Tailwind arbitrary values (e.g. `bg-[#effce9]`, `text-[#004817]`); literals only, no runtime-built class strings, so Tailwind's JIT scanner sees them.
- **Cascade quirk:** unlayered `reset.css` / `app.css` element rules beat Tailwind utilities. Use `!` important overrides where an element rule would otherwise win — specifically `img { border-radius: 4px }` (`app.css:11`), `h4 { margin }` (`reset.css:40`), and `a:hover { text-decoration: underline }` (`reset.css:60`). This mirrors the hero (`rounded-none!`, `m-0!`, `hover:no-underline!`).
- **React Router, not Remix** — import routing from `react-router`. Path alias `~/*` → `app/*`.
- **Do NOT rename the GraphQL query/fragment identifiers** (`RECOMMENDED_PRODUCTS_QUERY`, `RecommendedProductsQuery`, `RecommendedProductFragment`) — renaming forces a codegen ripple for no user-visible gain. Only React component names and on-screen copy change.
- **No test runner exists** in this repo (confirmed in CLAUDE.md). Do NOT add one. Per-task verification = `npm run typecheck` + `npm run lint` + a manual visual pass on the named route via `npm run dev`.
- Reuse `PawIcon` / `ArrowRightIcon` from `~/components/icons` (both already exist).

---

### Task 1: Decorated shared `ProductItem` card (site-wide)

**Files:**
- Modify: `app/components/ProductItem.tsx` (full rewrite of the component body)
- Modify: `app/styles/app.css:585-588` (remove `.product-item img` rule)

**Interfaces:**
- Consumes: nothing (first task).
- Produces: `ProductItem` gains an optional `isNew?: boolean` prop (default `false`). When `true`, a "New" badge overlays the image. Existing call sites that pass no `isNew` are unaffected. Task 2 relies on `<ProductItem product={...} isNew />`.

- [ ] **Step 1: Rewrite `app/components/ProductItem.tsx`**

Replace the entire file with:

```tsx
import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {
  ProductItemFragment,
  CollectionItemFragment,
  RecommendedProductFragment,
} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';

export function ProductItem({
  product,
  loading,
  isNew = false,
}: {
  product:
    | CollectionItemFragment
    | ProductItemFragment
    | RecommendedProductFragment;
  loading?: 'eager' | 'lazy';
  isNew?: boolean;
}) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;
  return (
    <Link
      className="product-item group flex flex-col rounded-3xl bg-white p-3 shadow-[0_18px_30px_-20px_rgba(1,51,18,0.35)] ring-1 ring-[#d6f3d0] transition duration-200 hover:-translate-y-1 hover:no-underline! hover:shadow-[0_26px_42px_-20px_rgba(1,51,18,0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00521d]"
      key={product.id}
      prefetch="intent"
      to={variantUrl}
    >
      <div className="relative overflow-hidden rounded-2xl bg-[#effce9]">
        {isNew ? (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-[#00521d] px-3 py-1 font-heading text-xs font-semibold uppercase tracking-wide text-white">
            New
          </span>
        ) : null}
        {image && (
          <Image
            alt={image.altText || product.title}
            aspectRatio="1/1"
            data={image}
            loading={loading}
            sizes="(min-width: 45em) 400px, 100vw"
            className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )}
      </div>
      <h4 className="mb-1! mt-3! font-heading text-base font-semibold leading-snug text-[#004817]">
        {product.title}
      </h4>
      <small className="font-heading text-sm font-semibold text-[#347345]">
        <Money data={product.priceRange.minVariantPrice} />
      </small>
    </Link>
  );
}
```

Notes on the class choices (do not skip):
- The image wrapper is `overflow-hidden rounded-2xl`, so it clips the image's default 4px corners to the panel radius — no `!` needed on the `<Image>` itself.
- `hover:no-underline!` is required — `reset.css:60` adds `text-decoration: underline` on `a:hover`, which the card link (an `<a>`) would otherwise inherit.
- `mt-3! mb-1!` on the `<h4>` overrides `reset.css:40`'s `h4 { margin-top/bottom: 0.5rem }`.
- `text-[#004817]` / `text-[#347345]` are direct classes on the elements, so they beat the color inherited from `a { color: #000 }` without `!`.

- [ ] **Step 2: Remove the superseded image rule in `app/styles/app.css`**

Delete this block (currently at `app/styles/app.css:585-588`) — image sizing now lives in the component (`h-auto w-full`):

```css
.product-item img {
  height: auto;
  width: 100%;
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS (no errors). Confirms the `isNew?: boolean` prop and imports typecheck against the generated Storefront types.

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: PASS (no new errors/warnings for `ProductItem.tsx`).

- [ ] **Step 5: Visual verification on a listing route**

Run the dev server (`npm run dev`) and open `/collections/all`.
Expected observations:
- Product cards render as **white rounded panels** with a soft shadow and faint green ring; hovering a card **lifts it** and slightly zooms its image.
- Titles are deep green, prices are muted green.
- **No "New" badge** appears (this route passes no `isNew`).
- Images are square, fill their frame, and are not stretched or clipped oddly (confirms removing `.product-item img` caused no regression). Spot-check `/search?q=` results too.

- [ ] **Step 6: Commit**

```bash
git add app/components/ProductItem.tsx app/styles/app.css
git commit -m "Decorate shared ProductItem card with optional New badge"
```

---

### Task 2: `NewArrivals` homepage section

**Files:**
- Modify: `app/routes/_index.tsx` (imports; rename + rewrite `RecommendedProducts` → `NewArrivals`; update the call site in `Homepage`)
- Modify: `app/styles/app.css:536-547` (remove `.recommended-products-grid` and `.recommended-product img`)

**Interfaces:**
- Consumes: `ProductItem` with `isNew` prop from Task 1 — used as `<ProductItem product={product} isNew />`.
- Produces: nothing downstream (terminal UI).

- [ ] **Step 1: Update imports in `app/routes/_index.tsx`**

Change the `react-router` import to add `Link`, and add the icon import. Replace:

```tsx
import {Await, useLoaderData} from 'react-router';
```

with:

```tsx
import {Await, Link, useLoaderData} from 'react-router';
```

and add this import alongside the existing component imports (below the `Hero` import line):

```tsx
import {ArrowRightIcon, PawIcon} from '~/components/icons';
```

- [ ] **Step 2: Update the call site in the `Homepage` default export**

In the `Homepage` component, replace:

```tsx
      <RecommendedProducts products={data.recommendedProducts} />
```

with:

```tsx
      <NewArrivals products={data.recommendedProducts} />
```

- [ ] **Step 3: Replace the `RecommendedProducts` function with `NewArrivals`**

Replace the entire `RecommendedProducts` function (from `function RecommendedProducts({` through its closing `}`) with:

```tsx
const NEW_ARRIVALS_CTA_HREF = '/collections/all';

function NewArrivals({
  products,
}: {
  products: Promise<RecommendedProductsQuery | null>;
}) {
  return (
    <section
      aria-labelledby="new-arrivals-heading"
      className="-mx-4 w-[calc(100%+2rem)] overflow-hidden bg-[#effce9] px-6 py-14 lg:px-[7vw] lg:py-20"
    >
      <div className="mx-auto max-w-[80rem]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col items-start">
            <span
              aria-hidden="true"
              className="grid size-11 place-items-center rounded-full bg-white text-primary ring-2 ring-[#a4e8aa]"
            >
              <PawIcon className="size-5" />
            </span>
            <h2
              id="new-arrivals-heading"
              className="mb-0! mt-4! font-heading text-4xl font-semibold leading-[0.95] tracking-[-0.06em] text-[#004817] lg:text-6xl"
            >
              New Arrivals
            </h2>
          </div>
          <Link
            to={NEW_ARRIVALS_CTA_HREF}
            className="hidden min-h-14 items-center gap-4 self-end rounded-full bg-primary py-2 pl-7 pr-2 text-lg font-semibold text-primary-foreground transition-transform hover:scale-[1.02] hover:no-underline! focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00521d] lg:inline-flex"
          >
            Explore all
            <span className="grid size-11 place-items-center rounded-full bg-[#effce9] text-primary">
              <ArrowRightIcon className="size-5" />
            </span>
          </Link>
        </div>

        <Suspense
          fallback={<div className="mt-10 text-[#347345]">Loading…</div>}
        >
          <Await resolve={products}>
            {(response) => (
              <div className="mt-10 grid grid-cols-2 gap-5 lg:mt-12 lg:grid-cols-4 lg:gap-6">
                {response
                  ? response.products.nodes.map((product) => (
                      <ProductItem key={product.id} product={product} isNew />
                    ))
                  : null}
              </div>
            )}
          </Await>
        </Suspense>

        <Link
          to={NEW_ARRIVALS_CTA_HREF}
          className="mt-10 flex min-h-14 items-center justify-center gap-4 rounded-full bg-primary px-7 text-lg font-semibold text-primary-foreground transition-transform hover:scale-[1.01] hover:no-underline! focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00521d] lg:hidden"
        >
          Explore all
          <span className="grid size-11 place-items-center rounded-full bg-[#effce9] text-primary">
            <ArrowRightIcon className="size-5" />
          </span>
        </Link>
      </div>
    </section>
  );
}
```

Notes:
- The section reuses the hero's full-bleed technique (`-mx-4 w-[calc(100%+2rem)] overflow-hidden bg-[#effce9]`) so it lines up edge-to-edge as a matching band.
- The **"Explore all" pill renders twice by design**: the first (`hidden lg:inline-flex`) sits top-right beside the heading on desktop; the second (`flex lg:hidden`) is a full-width footer CTA on mobile. Only one is visible per breakpoint.
- The paw is a decorative accent chip (`aria-hidden`), styled like the hero's icon chips; "New Arrivals" appears once, as the `<h2>` — no duplicate label text.
- `RECOMMENDED_PRODUCTS_QUERY` and the `RecommendedProductsQuery` type are **unchanged** — the deferred data flow is identical, only the presentation changed.

- [ ] **Step 4: Remove superseded grid CSS in `app/styles/app.css`**

Delete these two blocks (currently `app/styles/app.css:536-547`) — the grid is now a Tailwind grid on the section, and `.recommended-product` is a dead selector:

```css
.recommended-products-grid {
  display: grid;
  grid-gap: 1.5rem;
  grid-template-columns: repeat(2, 1fr);
  @media (min-width: 45em) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.recommended-product img {
  height: auto;
}
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: PASS. Confirms `Link`, the icons, the `isNew` prop, and the renamed component all typecheck.

- [ ] **Step 6: Lint**

Run: `npm run lint`
Expected: PASS (no new errors/warnings in `_index.tsx`).

- [ ] **Step 7: Visual verification on the homepage**

Run `npm run dev` and open `/`.
Expected observations:
- Below the hero, a **mint band** spans full width (no white gutters), reading as a sibling to the hero.
- A **paw accent chip** sits above the large deep-green **"New Arrivals"** display heading.
- **Desktop (≥1024px):** the orange **"Explore all"** pill sits top-right, aligned with the heading; the mobile footer pill is hidden.
- **Mobile (<1024px):** no top-right pill; a **full-width "Explore all"** pill appears below the grid.
- The four cards show the **"New" badge** and the decorated panel/hover-lift from Task 1.
- Both pills navigate to `/collections/all`; keyboard focus shows a visible green outline ring.

- [ ] **Step 8: Commit**

```bash
git add app/routes/_index.tsx app/styles/app.css
git commit -m "Restyle homepage section as hero-matching New Arrivals band"
```

---

## Self-Review

**Spec coverage** (against `2026-07-11-new-arrivals-section-design.md`):
- Rename section → "New Arrivals": Task 2 Steps 2–3 (component + heading copy). ✓
- Full-bleed mint band + display heading + paw eyebrow: Task 2 Step 3. ✓
- Responsive "Explore all" pill (desktop header-right / mobile footer): Task 2 Step 3. ✓
- Decorated shared card + hover-lift, site-wide: Task 1 Step 1. ✓
- Homepage-only "New" badge via `isNew` prop: Task 1 Step 1 (prop) + Task 2 Step 3 (passes `isNew`); collections/search omit it. ✓
- No per-card arrow chip (approved decision): Task 1 card has price only. ✓
- CSS reconciliation (`.recommended-products-grid`, `.recommended-product img`, `.product-item img`): Task 1 Step 2 + Task 2 Step 4. ✓
- GraphQL identifiers untouched; `tailwind.css` untouched: honored in both tasks + Global Constraints. ✓
- Verification = typecheck + lint + visual on homepage / a collection / search: Task 1 Step 5, Task 2 Step 7. ✓

**Placeholder scan:** No TBD/TODO; every code and CSS step shows complete content. ✓

**Type consistency:** `isNew?: boolean` defined in Task 1 is consumed as `isNew` in Task 2. `NewArrivals` prop type `{ products: Promise<RecommendedProductsQuery | null> }` matches the existing loader's deferred `recommendedProducts`. `PawIcon` / `ArrowRightIcon` / `Link` imports match their usage. ✓
