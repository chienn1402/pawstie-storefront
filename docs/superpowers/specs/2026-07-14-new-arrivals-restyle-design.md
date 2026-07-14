# New Arrivals restyle — design

**Date:** 2026-07-14
**Branch:** `feat/landing-page`
**Status:** approved

## Problem

The New Arrivals section reads as a template leftover next to the sections around it, and its product card is generic.

Three concrete mismatches:

1. **No section grammar.** `EverydayPromises`, `ShopByRoutine`, and `FinalCallToAction` all open with an uppercase eyebrow, then a display headline (`text-5xl`→`text-7xl`, `leading-[0.9]`, `tracking-[-0.065em]`), then a supporting line at `text-lg`. New Arrivals has no eyebrow, no supporting line, and a headline capped at `2.5rem` — roughly half the size of its neighbours.
2. **Wrong CTA species.** Every other "go somewhere" on the page is a `rounded-full` pill with the arrow in its own circular chip. New Arrivals uses a plain underlined text link, duplicated once for mobile and once for desktop.
3. **Card geometry fights the page.** The page's photo panels are `aspect-[4/5]` with radii from `2rem` to `3rem`; the card is a `1/1` image in a `rounded-3xl` (1.375rem) box. The "New" badge is a solid green blob where every other badge on the page is a white pill. There is no commerce affordance at all.

The background (`#effce9`) is **not** a problem: both hero layouts end in green panels (`#a4e8aa` / `#00521d`) pinned to their bottom edge, so mint-on-green is already a clean seam.

## Scope

In scope: `app/components/home/NewArrivals.tsx`, a new `app/components/ProductCard.tsx`, one new icon in `app/components/icons.tsx`, and the `RecommendedProduct` fragment in `app/routes/_index.tsx`.

Out of scope: `ProductItem` and the collection/search pages that consume it (see "Component boundary").

## Design

### Section frame — `NewArrivals.tsx`

Keep the full-bleed band (`-mx-4 w-[calc(100%+2rem)]`, `bg-[#effce9]`). Replace the bare heading with the page's standard three-part header, reusing `FinalCallToAction`'s type scale so the two mint sections rhyme:

- **Eyebrow** — "New this week", `font-heading text-sm! font-bold uppercase tracking-[0.16em] text-primary`
- **Headline** — "Just landed. Already loved.", `text-5xl! sm:text-6xl! lg:text-7xl!`, `leading-[0.9]!`, `tracking-[-0.065em]`, `max-w-[13ch]`, `text-[#004817]`
- **Supporting line** — `mt-8! max-w-[31rem] text-lg! leading-relaxed! text-[#347345]`
- **CTA** — "Shop all new", the orange pill from `FinalCallToAction` (white circular arrow chip, dual-arrow hover slide), to `/collections/all`

Header layout is `grid lg:grid-cols-[1fr_auto] lg:items-end`: eyebrow, headline, and paragraph in the left column; pill bottom-right in the right column. Mobile stacks to eyebrow → headline → paragraph → pill.

This collapses the two existing CTAs (one `lg:hidden`, one `hidden lg:inline-flex`) into a single pill.

Card row: `mt-12 lg:mt-16 grid grid-cols-2 gap-5 lg:grid-cols-4 lg:gap-6`.

### Component boundary — new `ProductCard`, `ProductItem` untouched

`ProductItem` is also consumed by `collections.$handle.tsx` and `collections.all.tsx`, whose fragments carry no variant data and which are still on template styling. Adding quick-add to it would mean editing two more queries and restyling two more pages — scope creep on a landing-section restyle.

So the designed, commerce-capable card lands as a new `app/components/ProductCard.tsx`, used by `NewArrivals` only. `ProductItem` is not modified. When the collection pages are styled later they migrate to `ProductCard` by extending their fragments.

### Card structure — `ProductCard.tsx`

The card is a `relative` container, **not** an `<a>`. A `<form>`/`<button>` cannot be nested inside an anchor, so the whole-card link is achieved with a stretched link instead:

- **Photo panel** — `aspect-[4/5]` on `bg-[#a4e8aa]`, `rounded-[1.25rem] lg:rounded-[1.5rem]`, image scales to `1.04` on group hover
- **"New" badge** — white pill, `#00521d` text, top-left (matching every other badge on the page). Driven by an `isNew` prop, as today; `NewArrivals` passes it on every card, since the query sorts by `UPDATED_AT` and every product in the row is by definition new.
- **Action cluster** — `absolute bottom-3 right-3 z-10` on the photo, echoing `ShopByRoutine`'s floating "Shop walk" pill. Always visible, never hover-only, so it works on touch.
- **Title** — `font-heading text-lg`, wrapping the `<Link>`, which carries `after:absolute after:inset-0` to stretch its hit area across the card
- **Price** — its own line beneath the title
- **Card** — `rounded-[1.75rem] lg:rounded-[2rem]`, white, keeping the existing `ring-1 ring-[#d6f3d0]` and lift-on-hover shadow

Clicking anywhere except the action cluster navigates to the product page. The cluster sits above the stretched link's overlay via `z-10`.

Buttons are `size-11` (44px touch target), each with an `aria-label` naming the product ("Add Chunky Rope Toy to cart"); icons are `aria-hidden`. Transforms carry `motion-reduce:transition-none`.

### Card states

| Product | Action cluster shows |
|---|---|
| Single variant, in stock | Quick-add icon (mint, green `CartIcon`) + quick-buy icon (orange, white `BoltIcon`) |
| Any option with more than one value | A single white "Choose options" pill linking to the PDP |
| Sold out | A static, non-interactive "Sold out" pill |

"Has real choices" is `product.options.some((o) => o.optionValues.length > 1)`. Combined-listing products are treated as ordinary multi-option products.

### Quick-add and quick-buy

Both use the existing `CartForm` + `CartForm.ACTIONS.LinesAdd` plumbing.

- **Quick-add** — adds the line, then calls `useAside().open('cart')` to pop the drawer, identical to `ProductForm`.
- **Quick-buy** — adds the line, then sends the browser to Shopify checkout. The `/cart` action's `redirectTo` only accepts a fixed URL, and `checkoutUrl` is not known until the mutation runs, so the redirect happens client-side: `CartForm`'s render-prop exposes the fetcher, and an effect fires when `fetcher.state === 'idle'` and `fetcher.data?.cart?.checkoutUrl` is present.

  The effect is guarded by a ref flag set at submit time, so a `fetcher.data` left over from a previous render cannot trigger a spurious redirect. Each `CartForm` owns its own fetcher, so the two buttons cannot cross-trigger.

  `checkoutUrl` is already selected by the cart fragment (`app/lib/fragments.ts:126`), so the cart query needs no change.

While either request is in flight the cluster dims and disables on `fetcher.state !== 'idle'`.

### Icons

`CartIcon` already exists in `app/components/icons.tsx`. Add one `BoltIcon` for quick-buy, following the existing `IconProps` signature.

### Query — `_index.tsx`

`RecommendedProduct` gains:

- `options { optionValues { name } }` — to detect products with real choices
- `selectedOrFirstAvailableVariant(selectedOptions: [], ignoreUnknownOptions: true, caseInsensitiveMatch: true)` selecting `id`, `availableForSale`, `price`, `image`, `product { handle title }`, `selectedOptions { name value }`

The variant's `image`, `price`, `product`, and `selectedOptions` are needed so the optimistic cart line renders correctly in the drawer before the server responds.

Run `npm run codegen` after the change (`storefrontapi.generated.d.ts` is a build artifact — never hand-edit).

## Constraints

- **Do not touch `app/styles/tailwind.css`.** The user owns the theme. Greens are arbitrary values (`#effce9`, `#a4e8aa`, `#00521d`, `#004817`, `#347345`); orange is the `primary` token.
- `reset.css` is inside `@layer base`, so Tailwind utilities already win — no `!` needed to beat it. The `img { border-radius }` rule in `app.css` is the one exception and still needs `rounded-none!` on raw `<img>` tags.
- React Router imports only — never `@remix-run/*` or `react-router-dom`.

## Verification

No test runner is configured in this repo. Verification is `npm run typecheck`, `npm run lint`, and a manual pass over the running dev server:

- Clicking the card body navigates to the product page
- Quick-add adds the line and opens the cart drawer; the card does not navigate
- Quick-buy adds the line and lands on Shopify checkout; the card does not navigate
- A multi-option product shows "Choose options" and links to its PDP
- Keyboard: the title link and both buttons are individually reachable and show focus rings
- Layout holds at 2-up mobile and 4-up desktop
