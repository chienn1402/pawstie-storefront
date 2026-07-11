# New Arrivals Section + Decorated Product Cards — Design

**Date:** 2026-07-11
**Status:** Approved (pending spec review)

## Goal

Re-style the homepage's product section so it reads as a sibling to the Pawstie
hero, and rename it from "Recommended Products" to **"New Arrivals"** — a label
that honestly describes the query (the 4 most-recently-updated products), where
"Recommended" implied personalization the query doesn't do.

The product **card** decoration is applied to the shared `ProductItem` component,
so collections and search inherit the same branded look.

## Scope

### In scope
- **Homepage section** (`app/routes/_index.tsx`): rename `RecommendedProducts` →
  `NewArrivals`; wrap in a full-bleed mint band matching the hero; add a display
  heading, a paw eyebrow, and an orange "Explore all" CTA pill.
- **Shared card** (`app/components/ProductItem.tsx`): convert the bare card into a
  branded rounded panel (site-wide — homepage, `/collections/*`, search).
- **Homepage-only "New" badge**: opt-in via a new `isNew` prop that only the
  homepage section passes.
- **CSS reconciliation** (`app/styles/app.css`): remove the superseded
  `.recommended-products-grid` and `.recommended-product img` rules; fold
  `.product-item img` sizing into the component.

### Out of scope (explicitly excluded)
- **Renaming the GraphQL query/fragment identifiers** (`RecommendedProducts`,
  `RecommendedProduct`, and their generated types). They are internal and renaming
  forces a codegen + type-import ripple for no user-visible gain. Only the React
  component name and on-screen copy change.
- Changing the query itself (sort order, product count, fields).
- Any change to the hero, header, or footer.
- A true product-recommendations API integration.

## Constraints

- **Do not edit `app/styles/tailwind.css`.** The user owns their theme.
  - Brand **orange** is the theme token `--primary` (`bg-primary` /
    `text-primary-foreground`).
  - The design's **greens are not in the theme**, so they are applied as **literal
    Tailwind arbitrary color values** (e.g. `bg-[#effce9]`, `text-[#004817]`)
    written directly in JSX. Literals only (no runtime-built class strings) so
    Tailwind's JIT scanner sees them.
- **Cascade quirk:** unlayered `reset.css` element rules beat Tailwind utilities.
  Apply `!` important overrides where a reset/element rule would otherwise win
  (e.g. keeping image corners rounded against a reset `border-radius: 0`) — the
  same pattern the hero already uses (`rounded-none!`, `m-0!`).
- **React Router, not Remix** — import from `react-router`. Path alias `~/*` → `app/*`.
- Reuse `PawIcon` / `ArrowRightIcon` from `~/components/icons`.
- No test runner configured; verification is typecheck + lint + manual visual pass.

## Design language reference (from the hero)

| Token | Value | Use |
| --- | --- | --- |
| Mint field | `#effce9` | Section background band, card image frame |
| Light green panel | `#a4e8aa` | (available for accents) |
| Deep green | `#00521d` | "New" badge, strong accents |
| Heading green | `#004817` | Display heading, card titles |
| Muted green | `#347345` | Body / supporting copy |
| Stat green | `#064a1c` | Optional emphasis |
| Orange | `--primary` token | CTA pill background |
| Display face | `font-heading` (Figtree Variable) | Headings, with tight negative tracking |

## Components

### `NewArrivals` (homepage section, in `_index.tsx`)
Replaces the `RecommendedProducts` function. Structure:

- **Outer band**: full-bleed via `-mx-4 w-[calc(100%+2rem)] bg-[#effce9]`, with
  vertical padding, so it butts against the hero as a matching band. Keeps
  `aria-labelledby` pointing at the heading id.
- **Header row** (flex; wraps on mobile):
  - Left: a small **🐾 paw eyebrow** ("New Arrivals" label) above the display
    `<h2 id="...">New Arrivals</h2>` in `font-heading`, `text-[#004817]`,
    tight `tracking-[-0.06em]`, large responsive size, `m-0!`.
  - Right (desktop, `lg+` only): an **"Explore all" pill** → `/collections/all`,
    styled like the hero CTA: `rounded-full bg-primary text-primary-foreground`,
    circular `ArrowRightIcon` chip, `hover:scale-[1.02]`, `focus-visible` outline.
- **Grid**: `grid grid-cols-2 gap-6 lg:grid-cols-4` (replaces
  `.recommended-products-grid`). Keeps the existing `Suspense` + `Await` deferred
  loading.
- **Mobile "Explore all"**: the same pill renders **full-width below the grid** as
  a footer CTA on small screens (hidden on `lg+`, where the header-row pill shows
  instead). A display heading + pill side-by-side is too cramped on narrow screens.
- Passes `isNew` to each `ProductItem`.

### `ProductItem` (shared card)
New signature: `{ product, loading?, isNew? }` — `isNew` defaults to `false`. No
breaking change to existing call sites (`collections.$handle.tsx`,
`collections.all.tsx` pass nothing new).

- **Panel**: the `<Link className="product-item">` becomes a white `rounded-3xl`
  card with padding, a soft green-tinted drop shadow, and a faint green ring.
  Hover **lifts** it (`hover:-translate-y-1` + deeper shadow, `transition`).
- **Image**: `rounded-2xl` mint-backed (`bg-[#effce9]`) frame, `aspect-ratio 1/1`,
  `object-cover`, corners forced with `!` if reset flattens them.
- **"New" badge** (only when `isNew`): top-left pill, `bg-[#00521d] text-white`,
  small `font-heading` label "New".
- **Title**: `<h4>` in `font-heading`, `text-[#004817]`, `m-0!` as needed.
- **Price**: green `Money` value, clean — **no** per-card arrow chip. The
  whole-card hover-lift is the only interaction affordance, keeping dense
  collection/search grids from feeling busy.

## Data flow

Unchanged. `_index.tsx` `loadDeferredData` still runs `RECOMMENDED_PRODUCTS_QUERY`
(`products(first: 4, sortKey: UPDATED_AT, reverse: true)`) and defers it; the
`NewArrivals` component still resolves the promise via `Suspense`/`Await`. Only
presentation and the section/component names change.

## Error / edge handling

- Deferred query failure still returns `null` and renders nothing in the grid
  (existing `.catch` behavior preserved) — the band + heading + pill still render.
- Products without a `featuredImage` render title + price without an image frame
  (existing guard preserved).
- The "New" badge never appears on collections/search because those call sites
  don't pass `isNew`.

## CSS reconciliation (`app/styles/app.css`)

- **Remove** `.recommended-products-grid` (superseded by Tailwind grid on the
  renamed section) and `.recommended-product img` (dead selector).
- **Remove/fold** `.product-item img { height: auto; width: 100% }` — the sizing
  moves into the component's Tailwind classes so there is a single source of truth.
  Must confirm no regression on collection/search grids, which currently rely on
  this rule for image sizing.

## Verification (no test runner in this repo)

1. `npm run typecheck`
2. `npm run lint`
3. Manual visual pass via `npm run dev` on **three** surfaces:
   - **Homepage** — mint band, display heading + eyebrow, orange "Explore all"
     pill, decorated cards with "New" badges.
   - **A collection grid** (`/collections/all`) — decorated cards, **no** "New"
     badge, dense grid still laid out correctly.
   - **Search results** — decorated cards render, no "New" badge, no broken image
     sizing after the `.product-item img` rule removal.
