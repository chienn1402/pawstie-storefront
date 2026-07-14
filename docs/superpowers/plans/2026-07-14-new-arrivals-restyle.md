# New Arrivals Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the landing page's New Arrivals section in the page's own visual language, and replace its generic product card with one that carries quick-add and quick-buy affordances.

**Architecture:** `NewArrivals` gains the eyebrow / display-headline / supporting-line / orange-pill header grammar already used by `EverydayPromises`, `ShopByRoutine`, and `FinalCallToAction`. A new `ProductCard` (presentation) plus `ProductCardActions` (cart mechanics) replaces `ProductItem` **on the landing page only**; `ProductItem` and the collection pages that consume it are untouched. Cart writes reuse the existing `CartForm` + `/cart` action plumbing.

**Tech Stack:** Hydrogen 2026.4.3 on React Router 7, Vite, Tailwind v4. Storefront GraphQL with codegen.

**Spec:** `docs/superpowers/specs/2026-07-14-new-arrivals-restyle-design.md`

## Global Constraints

- **There is no test runner in this repo.** No `test` script, no test files. Do not add one. Every task is verified by `npm run typecheck`, `npm run lint`, and a named manual check against `npm run dev`.
- **Never edit `app/styles/tailwind.css`.** The user owns the theme.
- **Never hand-edit `*.generated.d.ts`.** They are codegen artifacts. Run `npm run codegen`.
- Greens are arbitrary values: `#effce9` (section bg), `#a4e8aa` (mid), `#00521d` (deep), `#004817` (headings), `#347345` (body). Orange is the `primary` token — never a hex.
- `reset.css` lives in `@layer base` (`app/styles/reset.css:11`), so Tailwind utilities already beat it. **Do not add `!` to any class in new code.** The sibling files (`FinalCallToAction`, `ShopByRoutine`, `EverydayPromises`, `Hero`) are full of `!` because they predate that fix — do not copy their idiom. Their marks are redundant and are being left alone for now, not imitated.
- **The one exception:** `app/styles/app.css` is *not* layered, so its `img { border-radius: 4px }` (`app.css:11`) still beats utilities. Any `<img>`/`<Image>` needs `rounded-none!`. This is the only `!` that may appear in new code.
- Import routing from `react-router`. Never `@remix-run/*`, never `react-router-dom`.
- Path alias `~/*` → `app/*`.
- Approved copy, verbatim: eyebrow **"New this week"**, headline **"Just landed. Already loved."**, pill **"Shop all new"**.

---

## File Structure

| File | Responsibility |
|---|---|
| `app/routes/_index.tsx` | Modify: `RecommendedProduct` fragment gains variant + options |
| `app/components/icons.tsx` | Modify: add `BoltIcon` |
| `app/components/home/NewArrivals.tsx` | Modify: section header grammar, single CTA, card grid |
| `app/components/ProductCard.tsx` | Create: card presentation — photo panel, badge, stretched link, price |
| `app/components/ProductCardActions.tsx` | Create: cart mechanics — quick-add, quick-buy, choose-options, sold-out |
| `app/components/ProductItem.tsx` | **Untouched.** Still serves the collection pages. |

---

### Task 1: Extend the RecommendedProduct query

**Files:**
- Modify: `app/routes/_index.tsx:74-101`

**Interfaces:**
- Consumes: nothing.
- Produces: `RecommendedProductFragment` (in `storefrontapi.generated.d.ts`) gains `options: Array<{optionValues: Array<{name: string}>}>` and `selectedOrFirstAvailableVariant: {id, availableForSale, price, image, product: {handle, title}, selectedOptions} | null`. Tasks 3–5 depend on both.

- [ ] **Step 1: Replace the fragment**

In `app/routes/_index.tsx`, replace the `RecommendedProduct` fragment inside `RECOMMENDED_PRODUCTS_QUERY` with:

```graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    options {
      optionValues {
        name
      }
    }
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
    selectedOrFirstAvailableVariant(
      selectedOptions: []
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      id
      availableForSale
      price {
        amount
        currencyCode
      }
      image {
        id
        url
        altText
        width
        height
      }
      product {
        handle
        title
      }
      selectedOptions {
        name
        value
      }
    }
  }
```

Leave the `query RecommendedProducts` block below it exactly as it is.

The variant's `image`, `price`, `product`, and `selectedOptions` are not decoration — Hydrogen's optimistic cart uses them to render the new line in the cart drawer before the server responds.

- [ ] **Step 2: Regenerate types**

Run: `npm run codegen`
Expected: exits 0. `storefrontapi.generated.d.ts` now contains `selectedOrFirstAvailableVariant` inside `RecommendedProductFragment`.

Confirm with: `grep -c "selectedOrFirstAvailableVariant" storefrontapi.generated.d.ts` → a non-zero count.

- [ ] **Step 3: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: both pass. Nothing consumes the new fields yet, so this only proves the query is valid against the Storefront schema.

- [ ] **Step 4: Manual check**

Run: `npm run dev`, open the homepage.
Expected: the New Arrivals row still renders four products, unchanged. A malformed query would surface as a logged error and a missing row — the loader catches and returns `null`.

- [ ] **Step 5: Commit**

```bash
git add app/routes/_index.tsx storefrontapi.generated.d.ts
git commit -m "Fetch variant and option data for New Arrivals cards"
```

---

### Task 2: Rebuild the New Arrivals section frame

**Files:**
- Modify: `app/components/home/NewArrivals.tsx` (full rewrite)

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: the section shell. Task 3 swaps `ProductItem` for `ProductCard` inside the grid it establishes.

This task deliberately still renders `ProductItem`, so the section change can be reviewed on its own.

- [ ] **Step 1: Rewrite the component**

Replace the entire contents of `app/components/home/NewArrivals.tsx`:

```tsx
import {Suspense} from 'react';
import {Await, Link} from 'react-router';
import type {RecommendedProductsQuery} from 'storefrontapi.generated';
import {ArrowRightIcon} from '~/components/icons';
import {ProductItem} from '~/components/ProductItem';

const CTA_HREF = '/collections/all';

interface NewArrivalsProps {
  products: Promise<RecommendedProductsQuery | null>;
}

export function NewArrivals({products}: NewArrivalsProps) {
  return (
    <section
      aria-labelledby="new-arrivals-heading"
      className="-mx-4 w-[calc(100%+2rem)] overflow-hidden bg-[#effce9] px-6 py-20 lg:px-[7vw] lg:py-28"
    >
      <div className="mx-auto max-w-[80rem]">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16">
          <div className="min-w-0">
            <p className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-primary">
              New this week
            </p>
            <h2
              id="new-arrivals-heading"
              className="mb-0 mt-4 max-w-[13ch] font-heading text-5xl font-semibold leading-[0.9] tracking-[-0.065em] text-[#004817] sm:text-6xl lg:text-7xl"
            >
              Just landed. Already loved.
            </h2>
            <p className="mt-8 max-w-[31rem] text-lg leading-relaxed text-[#347345]">
              The newest toys, beds, and treats to reach the shelf — picked the
              moment they arrived.
            </p>
          </div>

          <Link
            to={CTA_HREF}
            className="group inline-flex min-h-16 shrink-0 items-center gap-5 self-start rounded-full bg-primary py-2 pl-8 pr-2 font-heading text-lg font-semibold text-white shadow-[0_12px_28px_-10px_rgba(169,83,14,0.5)] transition-[transform,box-shadow,background-color] duration-300 hover:-translate-y-0.5 hover:bg-[#8f440b] hover:no-underline hover:shadow-[0_20px_38px_-12px_rgba(169,83,14,0.65)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00521d] motion-reduce:transition-none motion-reduce:hover:translate-y-0 lg:self-auto lg:text-xl"
          >
            Shop all new
            <span className="relative grid size-12 place-items-center overflow-hidden rounded-full bg-white text-primary">
              <ArrowRightIcon className="size-5 transition-transform duration-300 motion-safe:group-hover:translate-x-[220%]" />
              <ArrowRightIcon className="absolute size-5 -translate-x-[220%] transition-transform duration-300 motion-safe:group-hover:translate-x-0" />
            </span>
          </Link>
        </div>

        <Suspense
          fallback={
            <div className="mt-12 text-[#347345] lg:mt-16">Loading…</div>
          }
        >
          <Await resolve={products}>
            {(response) => (
              <div className="mt-12 grid grid-cols-2 gap-5 lg:mt-16 lg:grid-cols-4 lg:gap-6">
                {response
                  ? response.products.nodes.map((product) => (
                      <ProductItem key={product.id} product={product} isNew />
                    ))
                  : null}
              </div>
            )}
          </Await>
        </Suspense>
      </div>
    </section>
  );
}
```

Three things this removes on purpose: the two duplicated "View all" text links (one `lg:hidden`, one `hidden lg:inline-flex`) collapse into the single pill, and the old `text-3xl` heading is gone.

- [ ] **Step 2: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: both pass.

- [ ] **Step 3: Manual check**

Run: `npm run dev`, open the homepage.
Expected:
- The headline is now the same size class as "Their next favorite thing is waiting." in the final CTA below.
- Exactly **one** CTA renders. Resize from mobile to desktop and confirm no second link appears.
- On desktop the pill sits bottom-right, baseline-aligned with the supporting paragraph. On mobile it drops below the paragraph.
- Hovering the pill slides one arrow out and the next in.

- [ ] **Step 4: Commit**

```bash
git add app/components/home/NewArrivals.tsx
git commit -m "Rebuild New Arrivals around the page's section grammar"
```

---

### Task 3: Add BoltIcon and the ProductCard shell

**Files:**
- Modify: `app/components/icons.tsx` (append)
- Create: `app/components/ProductCard.tsx`
- Modify: `app/components/home/NewArrivals.tsx` (swap `ProductItem` → `ProductCard`)

**Interfaces:**
- Consumes: `RecommendedProductFragment` from Task 1.
- Produces: `BoltIcon(props: SVGProps<SVGSVGElement>)`, used by Task 5. `ProductCard({product, loading, isNew})` where `product: RecommendedProductFragment` — Task 4 mounts `ProductCardActions` inside its photo panel.

This task builds the card with **no** action cluster yet, so the geometry can be reviewed before cart behaviour lands.

- [ ] **Step 1: Add BoltIcon**

Append to `app/components/icons.tsx`:

```tsx
export function BoltIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.4 2 4.6 13.2a.7.7 0 0 0 .55 1.13h4.62l-1.3 7.3a.7.7 0 0 0 1.25.54l8.8-11.2a.7.7 0 0 0-.55-1.13h-4.62l1.3-7.3A.7.7 0 0 0 13.4 2Z" />
    </svg>
  );
}
```

`IconProps` is already declared at the top of that file — do not redeclare it.

- [ ] **Step 2: Create the card**

Create `app/components/ProductCard.tsx`:

```tsx
import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {RecommendedProductFragment} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';

export function ProductCard({
  product,
  loading,
  isNew = false,
}: {
  product: RecommendedProductFragment;
  loading?: 'eager' | 'lazy';
  isNew?: boolean;
}) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;

  return (
    <div className="group relative flex flex-col rounded-[1.75rem] bg-white p-3 shadow-[0_18px_30px_-20px_rgba(1,51,18,0.35)] ring-1 ring-[#d6f3d0] transition duration-200 hover:-translate-y-1 hover:shadow-[0_26px_42px_-20px_rgba(1,51,18,0.45)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 lg:rounded-[2rem]">
      <div className="relative overflow-hidden rounded-[1.25rem] bg-[#a4e8aa] lg:rounded-[1.5rem]">
        {isNew ? (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-white px-3 py-1.5 font-heading text-xs font-semibold uppercase tracking-[0.12em] text-[#00521d] shadow-sm">
            New
          </span>
        ) : null}
        {image ? (
          <Image
            alt={image.altText || product.title}
            aspectRatio="4/5"
            data={image}
            loading={loading}
            sizes="(min-width: 64em) 20vw, 45vw"
            className="size-full rounded-none! object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="aspect-[4/5] w-full" />
        )}
      </div>

      <h3 className="mb-0 mt-4 font-heading text-lg font-semibold leading-snug tracking-[-0.02em] text-[#004817]">
        <Link
          className="rounded-sm text-[#004817] after:absolute after:inset-0 after:content-[''] hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00521d]"
          prefetch="intent"
          to={variantUrl}
        >
          {product.title}
        </Link>
      </h3>

      <p className="mt-1 font-heading text-base font-semibold text-[#347345]">
        <Money as="span" data={product.priceRange.minVariantPrice} />
      </p>
    </div>
  );
}
```

Three details that matter:

- The card is a `<div>`, **not** a `<Link>`. Task 4 puts `<button>`s inside it, and a button nested in an anchor is invalid HTML with unpredictable click behaviour.
- `after:absolute after:inset-0` on the title link stretches its hit area over the whole card (the card is `relative`). That preserves click-anywhere-to-open-product.
- `rounded-none!` on the `<Image>` neutralises `img { border-radius: 4px }` from `app/styles/app.css:11`, which is unlayered and beats utilities.
- `Money` renders a `<div>` by default, which is invalid inside a `<p>`. `as="span"` is required.

- [ ] **Step 3: Use it in NewArrivals**

In `app/components/home/NewArrivals.tsx`, change the import:

```tsx
import {ProductCard} from '~/components/ProductCard';
```

(delete the `ProductItem` import) and change the map body:

```tsx
                {response
                  ? response.products.nodes.map((product) => (
                      <ProductCard key={product.id} product={product} isNew />
                    ))
                  : null}
```

- [ ] **Step 4: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: both pass. If `ProductCard` errors on the `product` prop, Task 1's codegen did not run — re-run `npm run codegen`.

- [ ] **Step 5: Manual check**

Run: `npm run dev`, open the homepage.
Expected:
- Photos are now portrait `4/5`, not square, on a mid-green panel.
- The "New" badge is a **white** pill with green text, not a solid green blob.
- Clicking anywhere on the card — image, title, price, or the white margin around them — opens the product page.
- Tab to the card: the title link takes focus and shows a green outline.
- Collection pages (`/collections/all`) are visually unchanged — they still use `ProductItem`.

- [ ] **Step 6: Commit**

```bash
git add app/components/icons.tsx app/components/ProductCard.tsx app/components/home/NewArrivals.tsx
git commit -m "Introduce ProductCard with the page's photo-panel geometry"
```

---

### Task 4: Quick-add, choose-options, and sold-out states

**Files:**
- Create: `app/components/ProductCardActions.tsx`
- Modify: `app/components/ProductCard.tsx` (mount the cluster)

**Interfaces:**
- Consumes: `RecommendedProductFragment` (Task 1), `ProductCard`'s photo panel (Task 3).
- Produces: `ProductCardActions({product}: {product: RecommendedProductFragment})`. Task 5 adds `QuickBuyButton` to the in-stock branch of this same file.

- [ ] **Step 1: Create the actions component**

Create `app/components/ProductCardActions.tsx`:

```tsx
import {Link} from 'react-router';
import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';
import type {FetcherWithComponents} from 'react-router';
import type {RecommendedProductFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {CartIcon} from '~/components/icons';
import {useVariantUrl} from '~/lib/variants';

type CardVariant = NonNullable<
  RecommendedProductFragment['selectedOrFirstAvailableVariant']
>;

const CLUSTER = 'absolute bottom-3 right-3 z-10 flex items-center gap-2';

const ICON_BUTTON =
  'grid size-11 place-items-center rounded-full transition-[transform,background-color] duration-200 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:scale-100';

const PILL =
  'inline-flex min-h-11 items-center rounded-full bg-white px-4 font-heading text-sm font-semibold text-[#00521d] shadow-sm';

function cartLines(variant: CardVariant): Array<OptimisticCartLineInput> {
  return [{merchandiseId: variant.id, quantity: 1, selectedVariant: variant}];
}

function QuickAddButton({
  variant,
  title,
}: {
  variant: CardVariant;
  title: string;
}) {
  const {open} = useAside();

  return (
    <CartForm
      route="/cart"
      inputs={{lines: cartLines(variant)}}
      action={CartForm.ACTIONS.LinesAdd}
    >
      {(fetcher: FetcherWithComponents<any>) => (
        <button
          type="submit"
          onClick={() => open('cart')}
          disabled={fetcher.state !== 'idle'}
          aria-label={`Add ${title} to cart`}
          className={`${ICON_BUTTON} bg-[#effce9] text-[#00521d] ring-1 ring-[#d6f3d0] hover:bg-white`}
        >
          <CartIcon className="size-5" />
        </button>
      )}
    </CartForm>
  );
}

export function ProductCardActions({
  product,
}: {
  product: RecommendedProductFragment;
}) {
  const variantUrl = useVariantUrl(product.handle);
  const variant = product.selectedOrFirstAvailableVariant;
  const hasChoices = product.options.some(
    (option) => option.optionValues.length > 1,
  );

  if (hasChoices) {
    return (
      <div className={CLUSTER}>
        <Link
          to={variantUrl}
          prefetch="intent"
          className={`${PILL} transition-transform duration-200 hover:scale-105 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none motion-reduce:hover:scale-100`}
        >
          Choose options
        </Link>
      </div>
    );
  }

  if (!variant || !variant.availableForSale) {
    return (
      <div className={CLUSTER}>
        <span className={`${PILL} text-[#347345]`}>Sold out</span>
      </div>
    );
  }

  return (
    <div className={CLUSTER}>
      <QuickAddButton variant={variant} title={product.title} />
    </div>
  );
}
```

Why the cluster wins the click: it is positioned with `z-10`, while the stretched link's `::after` sits at `z-index: auto`. The buttons are on top, so they receive their own clicks and everything else falls through to the product link.

`FetcherWithComponents<any>` matches the existing signature in `app/components/AddToCartButton.tsx` — the cart action's response is not statically typed here.

- [ ] **Step 2: Mount the cluster in the photo panel**

In `app/components/ProductCard.tsx`, add the import:

```tsx
import {ProductCardActions} from '~/components/ProductCardActions';
```

and add the component as the **last child** of the photo-panel `<div>` — immediately after the `{image ? ... : ...}` expression, still inside the `<div className="relative overflow-hidden rounded-[1.25rem] ...">`:

```tsx
        <ProductCardActions product={product} />
```

- [ ] **Step 3: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: both pass.

- [ ] **Step 4: Manual check**

Run: `npm run dev`, open the homepage.
Expected:
- Each in-stock, single-variant card shows one mint circular cart button, bottom-right of the photo.
- Clicking it adds the line and **opens the cart drawer** — and does **not** navigate to the product page.
- While the request is in flight the button is disabled and dimmed.
- A product with real options (size/colour) shows a white "Choose options" pill instead, which navigates to the PDP.
- A sold-out product shows a non-interactive "Sold out" pill.
- Keyboard: Tab reaches the title link and the cart button separately; both show focus rings.

If the store has no multi-option or sold-out products, verify those two branches by temporarily forcing `hasChoices` to `true`, checking the render, then reverting.

- [ ] **Step 5: Commit**

```bash
git add app/components/ProductCardActions.tsx app/components/ProductCard.tsx
git commit -m "Add quick-add, choose-options, and sold-out states to the card"
```

---

### Task 5: Quick-buy — add the line, then jump to checkout

**Files:**
- Modify: `app/components/ProductCardActions.tsx`

**Interfaces:**
- Consumes: `CardVariant`, `cartLines`, `ICON_BUTTON`, `CLUSTER` from Task 4; `BoltIcon` from Task 3.
- Produces: nothing downstream. This is the last task.

The `/cart` action's `redirectTo` only accepts a **fixed** URL (`app/routes/cart.tsx:80-84`), and Shopify's `checkoutUrl` is not known until the `LinesAdd` mutation has run. So the redirect must happen client-side, off the resolved fetcher. `checkoutUrl` is already selected by the cart fragment (`app/lib/fragments.ts:126`), so no query changes are needed.

- [ ] **Step 1: Add the quick-buy button**

In `app/components/ProductCardActions.tsx`, extend the React import and add `BoltIcon`:

```tsx
import {useEffect, useRef} from 'react';
```

```tsx
import {BoltIcon, CartIcon} from '~/components/icons';
```

Then add these two components above `ProductCardActions`:

```tsx
function QuickBuyControl({
  fetcher,
  title,
}: {
  fetcher: FetcherWithComponents<any>;
  title: string;
}) {
  // Set on submit so a `fetcher.data` left over from an earlier render can
  // never fire a redirect the shopper did not ask for.
  const awaitingCheckout = useRef(false);

  useEffect(() => {
    if (fetcher.state === 'submitting') {
      awaitingCheckout.current = true;
      return;
    }
    if (fetcher.state !== 'idle' || !awaitingCheckout.current) return;

    awaitingCheckout.current = false;
    const checkoutUrl = fetcher.data?.cart?.checkoutUrl;
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  }, [fetcher.state, fetcher.data]);

  return (
    <button
      type="submit"
      disabled={fetcher.state !== 'idle'}
      aria-label={`Buy ${title} now`}
      className={`${ICON_BUTTON} bg-primary text-white hover:bg-[#8f440b]`}
    >
      <BoltIcon className="size-5" />
    </button>
  );
}

function QuickBuyButton({
  variant,
  title,
}: {
  variant: CardVariant;
  title: string;
}) {
  return (
    <CartForm
      route="/cart"
      inputs={{lines: cartLines(variant)}}
      action={CartForm.ACTIONS.LinesAdd}
    >
      {(fetcher: FetcherWithComponents<any>) => (
        <QuickBuyControl fetcher={fetcher} title={title} />
      )}
    </CartForm>
  );
}
```

The effect lives in `QuickBuyControl`, not `QuickBuyButton`, because `CartForm`'s child is a render prop — hooks cannot be called inside it.

Each `CartForm` owns a separate fetcher, so quick-add's response can never trigger quick-buy's redirect.

- [ ] **Step 2: Render it beside quick-add**

In `ProductCardActions`, replace the final in-stock `return` with:

```tsx
  return (
    <div className={CLUSTER}>
      <QuickAddButton variant={variant} title={product.title} />
      <QuickBuyButton variant={variant} title={product.title} />
    </div>
  );
```

- [ ] **Step 3: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: both pass.

- [ ] **Step 4: Manual check**

Run: `npm run dev`, open the homepage.
Expected:
- In-stock cards show two buttons: mint cart, then orange bolt.
- Clicking the **bolt** adds the line and lands on the Shopify checkout URL. It does **not** open the drawer, and does **not** navigate to the product page.
- Clicking the **cart** still opens the drawer and stays on the homepage — proving the two fetchers do not cross-trigger.
- Both buttons are 44px, and both are reachable and operable by keyboard.
- At mobile width (2-up grid) the two buttons still fit inside the photo panel without overlapping the "New" badge.

- [ ] **Step 5: Commit**

```bash
git add app/components/ProductCardActions.tsx
git commit -m "Add quick-buy that adds the line and jumps to checkout"
```

---

## Done when

- `npm run typecheck` and `npm run lint` both pass.
- The section header matches `FinalCallToAction`'s grammar, with one CTA rather than two.
- Cards are 4/5 photo panels with a white "New" pill, and click-anywhere opens the PDP.
- Quick-add opens the drawer; quick-buy reaches checkout; multi-option cards offer "Choose options"; sold-out cards say so.
- `ProductItem`, `/collections/all`, and `/collections/:handle` are byte-for-byte unchanged.
