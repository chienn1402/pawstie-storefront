# Product Details Page — Design

**Date:** 2026-07-15
**Route:** `app/routes/products.$handle.tsx`
**Status:** Approved (design), pending implementation plan

## Goal

Replace the raw Hydrogen skeleton product page with a polished, on-brand
product details page (PDP) that matches the Pawstie storefront's existing
design language (home page, `ProductCard`, header/footer).

## Context & constraints (from the live store)

- **8 active products, all single-variant** (`Default Title`) — variant option
  selectors currently render nothing. We keep the option-selector logic intact
  (restyled) so it works if the merchant ever adds real options, but the visible
  buy area is effectively just quantity + Add to cart.
- **One image per product** — no thumbnail gallery/carousel. The hero is a
  single branded image. (If a product ever has more images, that is out of
  scope for this pass.)
- **Descriptions** are an intro `<p>` plus a `<ul>` of ~3 feature bullets
  (`descriptionHtml`). Rendered as styled prose.
- **Sold-out matters** — some products have 0 inventory; the buy button and
  price area must handle the sold-out state.
- No per-product reviews, shipping, or care data exists — accordion content is
  static/generic copy.

## Design language to honor

- Greens as arbitrary values: `#004817` (headings), `#00521d` (deep green /
  selected), `#00752d`, `#347345` (muted body green), `#a4e8aa` (image frame
  bg), `#effce9` (light band), `#bfe9bb`/`#e2f2dd` (hairlines).
- Orange = `primary` design token (price + primary CTA).
- `font-heading` for headings; tight tracking (`tracking-[-0.04em]`/`-0.065em`).
- Asymmetric rounded image frame: `rounded-[2rem] rounded-br-[4.75rem]`.
- Primary CTA = orange pill with animated arrow-in-circle (matches Hero /
  FinalCallToAction).
- Eyebrow style: `font-heading text-sm font-bold uppercase tracking-[0.16em]`.
- Focus ring: `focus-visible:outline-2 focus-visible:outline-offset-3
  focus-visible:outline-[#00521d]`.
- Section container: `mx-auto max-w-[80rem]`, page padding `px-6 lg:px-[7vw]`.
- Full-bleed bands break out of `main`'s `margin: 0 1rem` with
  `-mx-4 w-[calc(100%+2rem)]`.

### Repo-specific CSS gotchas (must follow)

- **`img { border-radius: 4px }` is unlayered** (`app/styles/app.css`) and beats
  layered utilities → all `<Image>`/`<img>` elements need `rounded-none!`, with
  the rounded corner supplied by an `overflow-hidden` parent (the `ProductCard`
  pattern).
- **`reset.css` is in `@layer base`** now, so Tailwind padding utilities win →
  do **not** add `!` to `py-*`/`px-*`. (Older home components still carry `!`;
  do not copy that.)
- **`section { padding: 1rem 0 }`** base rule means any bare `<section>` gets
  vertical padding — always set explicit padding utilities.
- **Do not touch `app/styles/tailwind.css`** (user owns the theme tokens).
- **`CartForm` renders a real form element**; hit-testing uses its box, not its
  pixels. Keep any `CartForm`-based button in a normal in-flow, `relative z-10`
  container (the `ProductCardActions` pattern) so it doesn't overlay siblings.

## Layout (top → bottom)

1. **Breadcrumb** — `Home / Shop / {title}` (`Shop` → `/collections/all`).
2. **Hero** — two columns on `lg`, stacked on mobile:
   - **Left — image:** `overflow-hidden rounded-[2rem] rounded-br-[4.75rem]
     bg-[#a4e8aa]` frame; `<Image aspectRatio="4/5" className="size-full
     rounded-none! object-cover">`; graceful empty-frame fallback.
   - **Right — info column:**
     - Eyebrow: paw icon + `Pawstie` (vendor).
     - `<h1>` title (`font-heading`, `text-[#004817]`).
     - Price (large, orange) + `Save $X` pill when `compareAtPrice`; sold-out
       tag when unavailable.
     - Buy box: `QuantitySelector` (− / value / +) + Add-to-cart pill. Sold-out
       → disabled "Sold out" state.
     - Promise strip: 3 compact trust items (e.g. free shipping, easy returns,
       happy-pet guarantee) in a soft rounded card.
     - Description prose (lead paragraph + custom-bulleted list).
     - Details accordion (native `<details>`): "Shipping & returns",
       "Care & cleaning" (generic copy).
3. **"You may also like"** — full-bleed `#effce9` band, eyebrow + `<h2>`, grid of
   up to 4 `ProductCard`s. Section hidden if no recommendations resolve.
4. **`Analytics.ProductView`** — retained.

## Components (Approach B: decompose to focused units, thin route)

**Restyle in place:**

- `ProductImage` — branded frame, `rounded-none!` image, empty-state fallback.
- `ProductPrice` — large `font-heading` orange price; strikethrough compare-at
  in muted green; `Save $X` pill; sold-out aware.
- `ProductForm` — restyled option pills (selected =
  `bg-[#00521d] text-white`; available = `ring-1 ring-[#bfe9bb]` hover
  `bg-[#effce9]`; unavailable = disabled `opacity-40 line-through`). Hosts the
  quantity + Add-to-cart row.
- `AddToCartButton` — add a `className` passthrough onto the button
  (back-compatible; existing callers unaffected). Keeps `CartForm` +
  `relative z-10`.

**New:**

- `QuantitySelector` — accessible −/+ stepper (min 1), `aria-live` value.
- `ProductBreadcrumb` — `<nav aria-label="Breadcrumb"><ol>…`.
- `ProductPromises` — static trust strip.
- `ProductDetails` — styled `descriptionHtml` prose + native `<details>`
  accordion.
- `RelatedProducts` — `Suspense`/`Await` grid reusing `ProductCard`.
- `icons.tsx` additions — `TruckIcon`, `ShieldCheckIcon`, `MinusIcon`,
  `ChevronDownIcon` (as needed).

New components live flat in `app/components/` to match the existing product
components.

## Data / GraphQL

- Extend `PRODUCT_FRAGMENT` with `featuredImage { id url altText width height }`
  as a stable hero fallback when the selected variant has no image.
- Add a deferred recommendations query using
  `productRecommendations(productId: $productId, intent: RELATED)`, fetched
  **after** critical data resolves (needs `product.id`), returned as a deferred
  promise; `.catch(() => null)` so failure never 500s the page.
- Move the shared `RecommendedProduct` fragment out of `_index.tsx` into
  `app/lib/fragments.ts` (exported), and import it in both `_index.tsx` and the
  product route to avoid duplication. `RelatedProducts` reuses `ProductCard`, so
  the fragment shape stays identical.
- Fix `meta`: title `Pawstie | {title}`, `description` from
  `product.seo.description ?? product.description`, keep canonical.

## Loader shape

```
loader:
  criticalData = await loadCriticalData()   // { product }
  recommended  = storefront.query(RECOMMENDATIONS, {productId: product.id})
                   .catch(() => null)         // deferred promise
  return { product, recommended }
```

## Cleanup

- Remove dead `.product`, `.product-main`, `.product-image`,
  `.product-price-on-sale`, `.product-options-*`, `.product-option-label-swatch`
  blocks from `app/styles/app.css` (all replaced by Tailwind).

## Out of scope

- Multi-image gallery / zoom (data has one image per product).
- Real reviews, per-product shipping/care data, metafields.
- Quantity persistence across navigation; wishlist; recently-viewed.

## Verification

- `npm run codegen` after query changes; `npm run typecheck` and `npm run lint`
  clean.
- Drive the running dev server: load a PDP (e.g. the slow-feed bowl), confirm
  image frame, price, quantity stepper adds N to cart, sold-out product shows
  the disabled state, accordion opens, recommendations render, breadcrumb links
  work. Check keyboard focus states and mobile stacking.
```
