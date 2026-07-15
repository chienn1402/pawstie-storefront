# Shop Page — Browse & Filter

**Date:** 2026-07-15
**Route:** `app/routes/shop.tsx` (new) → `/shop`

## Problem

The storefront has a fully branded home page and product details page, but no
branded place to *browse the catalog*. The only catalog surfaces are the
untouched Hydrogen skeleton routes — `collections.all.tsx` renders a bare
`<h1>Products</h1>` over an unstyled `products-grid`, and `collections._index`
/ `collections.$handle` are equally raw. There is no single "Shop" destination
in the header, and nothing that lets a shopper narrow the catalog.

We want one **Shop page**: category navigation across the top, a product grid
below, on-brand, with sorting and pagination — a real browse experience.

### The data reality

The connected store is a **demo catalog**: 9 products, 8 of them
auto-generated "Default example products" (all tagged only `Sample Product`,
with empty `product_type`), plus one *unlisted* grooming comb that will not
appear on the storefront. There are **no real category collections** — only
"Default example products" collections. So category chips cannot be backed by
Shopify collections or product types; there is no taxonomy in the data.

The home page's `ShopByRoutine` already works around this by routing routine
words to search (`/search?q=walk|toy|bed|treat`). The Shop page follows the
same approach: **categories are routine keywords resolved by search**, not real
collections.

## Design

One route, `/shop`, whose entire state lives in the URL. Every control is a
link or a GET form that changes search params; the loader re-queries Shopify on
each navigation. This keeps the page shareable, bookmarkable, and
back-button-correct, with no client filtering state to manage.

### Route & navigation

- **New route** `app/routes/shop.tsx` → `/shop`. The legacy `collections.*`
  skeleton routes are left as-is *except* `collections.all`.
- **`collections.all.tsx` becomes a permanent redirect.** Its loader is
  replaced with `throw redirect('/shop', 301)` so Shopify's conventional
  "all products" URL (and any inbound/sitemap links) resolves to the new page
  instead of leaving a second, unstyled catalog page around. The query and
  component in that file are removed.
- **Header gets a "Shop" link.** In `Header.tsx`'s `HeaderMenu`, add an
  explicit `<NavLink to="/shop">Shop</NavLink>` immediately after the existing
  explicit "Home" link, rendered unconditionally the same way Home is — so it
  appears regardless of the Shopify-managed menu. Reuse the existing
  `navLinkClass`.

### Data flow

The loader reads three inputs from the URL and runs a **single** Storefront
`products(...)` query:

| URL param | Drives | Example |
|---|---|---|
| `category` | a free-text `query:` on the products connection | `walk` → `query: "walk"` |
| `sort` | `sortKey` + `reverse` | `price-asc` → `sortKey: PRICE, reverse: false` |
| Hydrogen cursor (`cursor`/`direction`) | Load-more pagination via `getPaginationVariables` | — |

**Categories** (source of truth: a local `CATEGORIES` array in the shop
feature). `id` is the URL value, `label` is the chip text, `query` is the
Storefront search string (`null` = no filter):

| id | label | query |
|---|---|---|
| `all` | All | `null` |
| `walk` | Walk | `walk` |
| `play` | Play | `toy` |
| `snooze` | Snooze | `bed` |
| `treat` | Treat | `treat` |
| `feeding` | Feeding | `bowl` |

The `walk`/`toy`/`bed`/`treat` mappings match `ShopByRoutine` exactly. `feeding`
(`bowl`) is added so the two feeding bowls + slow-feed bowl surface as their own
chip instead of only appearing under "All". `CATEGORIES` is defined locally in
the shop feature — `ShopByRoutine`'s `ROUTINES` array is **not** refactored to
share it (out of scope; it also carries images the shop chips don't need).

**Sorts** (source of truth: a local `SORTS` array):

| id | label | sortKey | reverse |
|---|---|---|---|
| `featured` | Featured | `BEST_SELLING` | `false` |
| `newest` | Newest | `CREATED_AT` | `true` |
| `price-asc` | Price: Low to High | `PRICE` | `false` |
| `price-desc` | Price: High to Low | `PRICE` | `true` |

`featured` is the default when `sort` is absent or unrecognized; `all` is the
default when `category` is absent or unrecognized. Both params are validated
against the config arrays — an unknown value falls back to the default rather
than passing raw user input to Shopify.

The query selects `...RecommendedProduct` nodes plus `pageInfo`, reusing the
exported `RECOMMENDED_PRODUCT_FRAGMENT` so the grid can render the branded
`ProductCard` (which needs `options`, `selectedOrFirstAvailableVariant`, etc.
for its quick-add / choose-options / sold-out logic). `pageBy` is 12.

Shape:

```graphql
query ShopProducts(
  $query: String
  $sortKey: ProductSortKeys
  $reverse: Boolean
  $first: Int, $last: Int, $startCursor: String, $endCursor: String
  $country: CountryCode, $language: LanguageCode
) @inContext(country: $country, language: $language) {
  products(
    query: $query
    sortKey: $sortKey
    reverse: $reverse
    first: $first, last: $last, before: $startCursor, after: $endCursor
  ) {
    nodes { ...RecommendedProduct }
    pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
  }
}
```

Changing a chip or the sort links to a fresh URL **without** the cursor params,
so pagination resets to the first page automatically on any filter/sort change.

The loader is defensive: it wraps the query in try/catch (or `.catch`) and, on
error, returns an empty connection so the page renders a normal empty state
rather than 500-ing — matching the deferred-data pattern used elsewhere.

### Result count — honest, not faked

The Storefront `products` connection returns **no total count**, and there is no
cheap way to get one for a filtered connection. So the count reflects the number
of products on the **current loader page**, labeled plainly (e.g. `8 products`).
With `pageBy: 12` and only ~8 storefront-visible products, the demo catalog is a
single page, so this equals the true selection total today. Accumulating the
count across "Load more" presses is not implemented, so on a larger, paginated
catalog the count would show the latest page's size rather than a running
total. We do **not** issue a second query or over-fetch to fabricate a total.

### Layout

```
┌───────────────────────────────────────────────────────────┐
│  Shop                                    ← title band       │
│  Everything your pets love, in one place.                   │
├───────────────────────────────────────────────────────────┤
│ [All][Walk][Play][Snooze][Treat][Feeding]   8 products  Sort▾│  controls
├───────────────────────────────────────────────────────────┤
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐                                │
│  │card│ │card│ │card│ │card│      ← ProductCard, 2→3→4 cols │
│  └────┘ └────┘ └────┘ └────┘                                │
│                     [ Load more ]                            │
└───────────────────────────────────────────────────────────┘
```

- **Title band:** an `<h1>` "Shop" in `font-heading` with a one-line subtitle,
  in the brand's green register — lighter than the home hero, consistent with
  the page-header treatment used elsewhere.
- **Controls bar:** category chips on the left; result count + sort on the
  right. On mobile the chips wrap (or scroll horizontally) and the count/sort
  sit below.
- **Chips:** pill **links** reusing the existing pill visual language (green
  fill + white text when active, soft green when inactive). Each chip's `to`
  sets `category` and **preserves the current `sort`** (but drops the cursor).
  The active chip carries `aria-current="page"`.
- **Sort:** a native `<select>` inside a `<Form method="get">`, auto-submitting
  on change, with a visible or `sr-only` `<label>` "Sort by". The form
  **preserves the current `category`** via a hidden input (and drops the
  cursor). Native select keeps it accessible without a custom popup.
- **Grid:** reuse `ProductCard` inside the repo's `PaginatedResourceSection`
  (Hydrogen `<Pagination>` "Load more"), in a responsive grid matching
  `NewArrivals` / `RelatedProducts` (2 cols → 3 → 4). First-page images
  `loading="eager"` for the initial rows, the rest lazy.
- **Empty state:** when a category returns no products, render a friendly
  message and a "View all" link that clears `category` back to `all`.

### Components

Kept small and single-purpose:

- `app/routes/shop.tsx` — loader (param parsing + validation, query), `meta`,
  and page composition. Imports the `CATEGORIES` / `SORTS` config from
  `app/lib/shop.ts` (below) rather than defining it inline.
- `app/components/shop/ShopControls.tsx` — presentational: renders the chip
  row + sort select + count. Takes the active `category`, active `sort`,
  loaded `count`, and the config arrays; builds the URLs. No data fetching.
- `app/lib/shop.ts` (small) — the `CATEGORIES` and `SORTS` config plus helpers
  to resolve a param to its config entry (with fallback). Shared by the loader
  and `ShopControls` so the source of truth is one place.
- Reused unchanged: `ProductCard`, `ProductCardActions`,
  `PaginatedResourceSection`, `RECOMMENDED_PRODUCT_FRAGMENT`.

### Accessibility

- `<h1>` "Shop" is the page's single top-level heading; product titles remain
  `<h3>` inside `ProductCard`.
- Chips are links with `aria-current="page"` on the active one.
- Sort select has an associated `<label>`.
- The result count sits in an `aria-live="polite"` region so screen-reader
  users hear it change after a filter/sort navigation.
- Focus-visible rings match the existing green outline treatment
  (`focus-visible:outline-[#00521d]`).

## Constraints

- **Do not touch `app/styles/tailwind.css`.** The user owns the theme. Greens
  are arbitrary values (`#004817`, `#00521d`, `#effce9`, `#a4e8aa`, `#00752d`);
  orange is the `primary` token. No new palette colors.
- `reset.css` element rules are unlayered-ish and bite: `img` carries a
  `border-radius` (use `rounded-none!` on images, as the existing cards do),
  and a bare `<section>` silently gets 32px padding — every `<section>` here
  must set explicit padding utilities. Headings may need `!` overrides,
  matching the existing pattern.
- **React Router, not Remix.** Import `useLoaderData`, `Link`, `NavLink`,
  `Form`, `redirect` from `react-router`. Never `react-router-dom`.
- No new dependencies.
- Run `npm run codegen` after adding the GraphQL query so
  `storefrontapi.generated.d.ts` picks up `ShopProductsQuery`.

## Verification

No test runner exists in this repo. Verification is:

1. `npm run codegen`, then `npm run typecheck` and `npm run lint` pass.
2. Driven in a real browser at `/shop`:
   - The grid renders branded `ProductCard`s.
   - Each chip filters the grid and updates the URL `?category=`; `aria-current`
     moves; the active sort is preserved across chip changes.
   - Each sort option reorders the grid and updates `?sort=`; the active
     category is preserved.
   - A category with no matches shows the empty state + "View all" reset.
   - "Load more" appends the next page (verified by forcing `pageBy` low, e.g.
     3, during testing) and preserves the active category + sort.
   - The result count matches the number of cards shown.
3. `/collections/all` 301-redirects to `/shop`.
4. The header "Shop" link appears and is active (`aria-current`) on `/shop`.
5. Mobile layout checked at a narrow viewport: chips wrap/scroll, grid drops to
   2 columns, controls stack.
6. Keyboard pass: Tab reaches chips and the sort select; focus rings are
   visible; the count announces on change.
