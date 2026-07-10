# Pawstie Hero Section + Header Re-skin — Design

**Date:** 2026-07-10
**Status:** Approved (pending spec review)

## Goal

Build the Pawstie storefront homepage hero, matching the provided desktop and
mobile design mockups, and re-skin the global header to the design's pill style.
Mobile-first and responsive across mobile / tablet / desktop.

## Scope

### In scope
- **Hero section** (homepage only): headline, three animal cutouts, and the three
  stat/CTA panels (98K+ clients, "Best Products for Your Pet" + CTA, 4.6 rating).
- **Header re-skin** (global): logo, data-driven nav, and search / cart / account
  pill controls, styled to match the mockup.
- Keep the existing **Recommended Products** grid below the hero.

### Out of scope (explicitly excluded)
- "Cozy Cat House" product card (desktop, top-left).
- "Watch Product Reviews on TikTok and YouTube" video card.
- "New Arrivals" product grid (mobile, third screen).
- The header's 4-star favorites badge.
- Removing the placeholder **Featured Collection** section — it is dropped (replaced
  by the hero); Recommended Products stays.

## Constraints

- **Do not edit `app/styles/tailwind.css`.** The user owns their theme. Consequences:
  - The brand **orange** is the theme token `--primary` (`bg-primary` / `text-primary`).
    The mockup's orange is slightly brighter; we accept the theme's shade to respect
    the theme.
  - The design's **greens are not in the theme**, so they are applied as **literal
    Tailwind arbitrary color values** (e.g. `bg-[#14421e]`) written directly in JSX.
    Literals only (no runtime-built class strings) so Tailwind's JIT scanner sees them.
- **React Router, not Remix** — import from `react-router`. Path alias `~/*` → `app/*`.
- Node/Hydrogen/Oxygen runtime; no test runner configured.
- Import images from `~/assets/*` so Vite fingerprints them (`assetsInlineLimit: 0`
  keeps them as separate files, which is fine).

## Working color palette (approximate; fine-tune against mockups)

| Role | Value | Usage |
|------|-------|-------|
| Deep green (frame / dark panel) | `#14421e` | hero outer frame, center CTA panel background |
| Headline / heading text green | `#1c4a25` | "Everything Your Pets Love", panel numbers |
| Mint card background | `#e9f6e1` | hero card surface |
| Spring-green panel | `#a6dd9d` | left (98K+) and right (4.6) panels |
| Muted green body text | `#4f8a57` | panel subtitles ("Happy Clients…", "Based on Reviews…") |
| Pale-mint pill fill | `#eef7e9` | header control pill backgrounds |
| Brand orange | theme `--primary` | paw logo, rating star, "Explore Products" CTA |
| On-orange / on-dark text | `white` / theme `--primary-foreground` | CTA label, dark-panel text |

## Architecture

Two components, following the existing component conventions in `app/components/`.

### `app/components/Hero.tsx` (new)
Self-contained, presentational, no props required. Imports the three PNGs and holds
all static marketing copy. Rendered at the top of the homepage `<main>` via `_index.tsx`.

Internal structure (small sub-parts for clarity, all in one file):
- `Hero` — the deep-green framed `<section>` wrapping a mint rounded card.
- Panel pieces reused across breakpoints: a `ClientsPanel` (98K+), a `CtaPanel`
  ("Best Products for Your Pet" + Explore Products button), a `RatingPanel` (4.6 ★).
- The headline and the three `<img>` cutouts.

### `app/components/Header.tsx` (re-skin existing)
Keep it **data-driven** and page-agnostic (it renders on every page via `PageLayout`).
Only the markup/classes change; the data wiring (Shopify `menu`, `cart`, `isLoggedIn`,
asides) is preserved.

- **Left:** orange paw glyph + brand name from `shop.name` (renders "Pawstie"; the
  mockup's "CozyPaws" is just mock branding).
- **Center (desktop, `md+`):** `HeaderMenu` links from the Shopify menu; active link
  bold + heading-green. Hidden on mobile behind the existing hamburger → mobile aside.
- **Right pills:** search (opens search aside), cart (cart glyph + count badge +
  subtotal `Money`, opens cart aside), account (user glyph → `/account`).
- Header background: white (`bg-background`, page-agnostic); control pills use the
  pale-mint fill so they read as pills. The 4-star badge is omitted.
- **Interpretation note:** the mockup shows the header *inside* the rounded green
  frame. Because the header is global (shared by all routes) and the frame is
  homepage-only, we do **not** wrap the header in the green frame. The header is a
  light pill bar directly above the framed hero. This keeps the header consistent on
  product/cart/etc. pages.

## Responsive layout

**Mobile-first**: base styles target mobile; `md:` and `lg:` progressively enhance.

### Mobile (base) — single column, in the required order
1. **Golden-retriever block** — headline "Everything Your Pets Love" → golden
   retriever cutout → dark-green panel: "Best Products for Your Pet" + orange
   **Explore Products** pill.
2. **Dachshund block** — dachshund cutout peeking over a spring-green panel with
   `98K+` + "Happy Clients and Their Pets Who Love Our Products".
3. **Cat block** — cat cutout peeking over a spring-green panel with `4.6 ★` +
   "Based on Reviews from Happy Pet Owners Worldwide".

Each block: the animal's bottom sits just above / overlapping the top edge of its
colored panel (the "peeking over a ledge" effect via negative margin + `z-index`).

### Tablet (`md`)
Intermediate: headline scales up; blocks may pair two-up where space allows, moving
toward the desktop composition. Primary goal is legibility and no overflow.

### Desktop (`lg+`) — the full composition
- Deep-green framed section, mint rounded card inset.
- Large centered headline near the top.
- A bottom band split into three columns:
  `[ 98K+ panel | dark-green CTA panel | 4.6 panel ]` (spring / deep / spring green).
- The three animals overlap the top of the band: **golden retriever centered and
  largest** (spanning over the CTA panel), **dachshund** over the left panel, **cat**
  over the right panel. Achieved with a CSS grid for the band + absolutely/negatively
  positioned images layered above it (`z-index`).

## Data & behavior

- Hero copy, numbers (`98K+`, `4.6`), and labels are **static** (hardcoded in `Hero.tsx`).
- **Explore Products** → `<Link to="/collections/all">`.
- The `98K+` panel's small avatar cluster renders as a styled circular glyph
  (icon/initials), not an external photo (no such asset).
- Header search/cart/account keep their **existing behaviors** (asides, `/account`,
  optimistic cart count). Cart pill additionally shows the subtotal via Hydrogen's
  `Money` when cart data is present.
- No new GraphQL. Cart subtotal uses fields already present on the cart fragment; if a
  needed field is missing, fall back to showing count only rather than adding a query.

## Accessibility

- Animal images are decorative → `alt=""` (or `aria-hidden`); the headline carries the
  meaning. Use one `<h1>` for "Everything Your Pets Love".
- CTA is a real `<Link>`; pill controls are `<button>`/`<a>` with accessible labels
  (reuse existing header aria patterns).
- Color contrast: dark-green text on mint and white on deep-green/orange all pass AA.

## Files touched

- `app/components/Hero.tsx` — **new**.
- `app/routes/_index.tsx` — render `<Hero />` at top of `<main>`; remove the
  `FeaturedCollection` usage + its query; keep `RecommendedProducts`.
- `app/components/Header.tsx` — re-skin markup/classes; preserve data wiring.
- Possibly a small icon helper (inline SVGs for paw / search / cart / star / user /
  arrow) co-located in the components.

## Success criteria

- Homepage renders the hero matching the mockups at mobile, tablet, and desktop
  widths, with the required mobile stacking order (retriever → dachshund → cat).
- Header shows the re-skinned pill layout with working search / cart / account and
  data-driven nav; no 4-star badge.
- `tailwind.css` is unchanged; greens are arbitrary values; orange is `--primary`.
- Recommended Products still renders below the hero.
- `npm run lint` and `npm run typecheck` pass.

## Non-goals / follow-ups

- Wiring hero stats to real data, the excluded cards/sections, and any header changes
  beyond the re-skin are out of scope for this pass.
