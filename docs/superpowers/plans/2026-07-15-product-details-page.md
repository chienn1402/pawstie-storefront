# Product Details Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the raw Hydrogen skeleton product page (`app/routes/products.$handle.tsx`) with a polished, on-brand product details page (PDP) that matches the Pawstie storefront's existing design language.

**Architecture:** Keep the route thin and decompose the PDP into focused, in-flow components under `app/components/`. Restyle the existing `ProductImage`/`ProductPrice`/`ProductForm`/`AddToCartButton` in place; add new `QuantitySelector`, `ProductBreadcrumb`, `ProductPromises`, `ProductDetails`, `RelatedProducts` components; extend the product GraphQL fragment and add a deferred `productRecommendations` query streamed via `Suspense`/`Await`.

**Tech Stack:** Shopify Hydrogen 2026.4.3, React Router 7, Tailwind CSS v4 (CSS-first, no config file), TypeScript, GraphQL codegen (two schemas).

## Global Constraints

Every task's requirements implicitly include this section.

- **Branch:** all work continues on `feature/product-details-page` (already checked out; branched off `main`). Do not commit to `main`. Do not push unless the user asks.
- **Commit style:** match the repo's existing imperative, sentence-style subject lines (e.g. "Clear the discount input after a code is applied"). **No `feat:`/`fix:` prefixes.** End every commit message with the trailer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **React Router, not Remix.** Import routing hooks/components from `react-router`. Never from `@remix-run/*` and never from `react-router-dom`.
- **Path alias:** `~/*` → `app/*`.
- **Do not touch `app/styles/tailwind.css`** — the user owns the theme tokens. `--primary` is the orange token; greens are arbitrary values.
- **`img { border-radius: 4px }` is unlayered** (`app/styles/app.css:8`) and beats every layered utility → every `<Image>`/`<img>` needs `rounded-none!`, with the rounded corner supplied by an `overflow-hidden` parent.
- **`reset.css` is in `@layer base`** → Tailwind padding/margin/text utilities win WITHOUT `!`. Do **not** add `!` to `py-*`/`px-*`/`mb-*`/`text-*`. (Older `app/components/home/*` files still carry `!`; do not copy that habit.)
- **`section { padding: 1rem 0 }`** and **`li { margin-bottom: 0.5rem }`** are base rules → set explicit utilities (`mb-0`, explicit padding) where you need to neutralize them.
- **Full-bleed bands** break out of `main`'s `margin: 0 1rem` with `-mx-4 w-[calc(100%+2rem)]`. This only works when the band is a near-direct child of `<main>` (no padded ancestor between it and `main`).
- **`CartForm` renders a real `<form>` element**; hit-testing uses its box, not its pixels. Keep any `CartForm`-based button in a normal in-flow, `relative z-10` container so it never overlays siblings. The `className` you pass to `AddToCartButton` lands on the inner `<button>`, not the form — do not rely on it to size the form.
- **Design tokens:** greens `#004817` (headings), `#00521d` (deep green / selected), `#00752d` (hover green), `#347345` (muted body green), `#a4e8aa` (image frame bg), `#effce9` (light band), `#bfe9bb`/`#e2f2dd`/`#ccefc8` (hairlines/rings); `primary` = orange. Headings use `font-heading` with tight tracking. Focus ring: `focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#00521d]`.

### Testing note (read before Task 1)

**There is no test runner in this repo** and CLAUDE.md forbids assuming one — do not add a test framework. The per-task verification gate is therefore:

1. `npm run codegen` — **only** for tasks that change a GraphQL document.
2. `npm run typecheck` — must exit 0.
3. `npm run lint` — must be clean.

Behavioral verification (browser drive) is consolidated into the final acceptance task (Task 13), run once against `npm run dev`.

---

### Task 1: Add icons

**Files:**
- Modify: `app/components/icons.tsx` (append new exports)

**Interfaces:**
- Consumes: nothing.
- Produces: `MinusIcon`, `TruckIcon`, `ShieldCheckIcon`, `ChevronDownIcon` — each `(props: SVGProps<SVGSVGElement>) => JSX.Element`, same shape as the existing icons in this file.

- [ ] **Step 1: Append the four icons**

Add these functions at the end of `app/components/icons.tsx` (after `CloseIcon`, before EOF):

```tsx
export function MinusIcon(props: IconProps) {
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
      <path d="M5 12h14" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function TruckIcon(props: IconProps) {
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
      <path d="M2 5.5h10.5v9.5H2z" />
      <path d="M12.5 8.5H16l3.5 3.5V15h-7z" />
      <circle cx="6.5" cy="17.5" r="1.7" />
      <circle cx="16.5" cy="17.5" r="1.7" />
    </svg>
  );
}

export function ShieldCheckIcon(props: IconProps) {
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
      <path d="M12 3 5 6v5c0 4.2 2.9 7.4 7 8.8 4.1-1.4 7-4.6 7-8.8V6l-7-3Z" />
      <path d="m9 11.5 2 2 4-4" />
    </svg>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: both exit 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add app/components/icons.tsx
git commit -m "Add minus, chevron, truck, and shield-check icons" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Restyle ProductImage

**Files:**
- Modify (full rewrite): `app/components/ProductImage.tsx`

**Interfaces:**
- Consumes: `PawIcon` from `~/components/icons`; `ProductVariantFragment['image']` type.
- Produces: `ProductImage({image, title?})` — `image: ProductVariantFragment['image']`, `title?: string`. Renders the branded frame with the empty-state fallback.

- [ ] **Step 1: Rewrite the component**

Replace the entire contents of `app/components/ProductImage.tsx`:

```tsx
import type {ProductVariantFragment} from 'storefrontapi.generated';
import {Image} from '@shopify/hydrogen';
import {PawIcon} from '~/components/icons';

export function ProductImage({
  image,
  title,
}: {
  image: ProductVariantFragment['image'];
  title?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] rounded-br-[4.75rem] bg-[#a4e8aa]">
      {image ? (
        <Image
          alt={image.altText || title || 'Product image'}
          aspectRatio="4/5"
          data={image}
          key={image.id}
          sizes="(min-width: 64em) 45vw, 100vw"
          className="size-full rounded-none! object-cover"
        />
      ) : (
        <div className="grid aspect-[4/5] w-full place-items-center text-[#00521d]/40">
          <PawIcon className="size-16" />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: both exit 0. (The route still passes `image={selectedVariant?.image}` — the added optional `title` prop is back-compatible.)

- [ ] **Step 3: Commit**

```bash
git add app/components/ProductImage.tsx
git commit -m "Restyle the product image into a branded frame" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Restyle ProductPrice

**Files:**
- Modify (full rewrite): `app/components/ProductPrice.tsx`

**Interfaces:**
- Consumes: `Money` from `@shopify/hydrogen`; `MoneyV2` type.
- Produces: `ProductPrice({price?, compareAtPrice?, availableForSale?})` — `price?: MoneyV2`, `compareAtPrice?: MoneyV2 | null`, `availableForSale?: boolean` (defaults `true`). Renders large orange price, muted strikethrough compare-at, a `Save $X` pill, and a `Sold out` tag when `availableForSale === false`.

- [ ] **Step 1: Rewrite the component**

Replace the entire contents of `app/components/ProductPrice.tsx`:

```tsx
import {Money} from '@shopify/hydrogen';
import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';

function formatSavings(
  price?: MoneyV2,
  compareAtPrice?: MoneyV2 | null,
): string | null {
  if (!price || !compareAtPrice) return null;
  const diff = Number(compareAtPrice.amount) - Number(price.amount);
  if (!(diff > 0)) return null;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: price.currencyCode,
    maximumFractionDigits: Number.isInteger(diff) ? 0 : 2,
  }).format(diff);
}

export function ProductPrice({
  price,
  compareAtPrice,
  availableForSale = true,
}: {
  price?: MoneyV2;
  compareAtPrice?: MoneyV2 | null;
  availableForSale?: boolean;
}) {
  const saved = formatSavings(price, compareAtPrice);

  return (
    <div
      aria-label="Price"
      role="group"
      className="flex flex-wrap items-center gap-x-4 gap-y-2"
    >
      {price ? (
        <span className="font-heading text-4xl font-semibold tracking-[-0.04em] text-primary sm:text-5xl">
          <Money as="span" data={price} />
        </span>
      ) : (
        <span>&nbsp;</span>
      )}
      {compareAtPrice ? (
        <s className="font-heading text-xl text-[#347345]/70">
          <Money as="span" data={compareAtPrice} />
        </s>
      ) : null}
      {saved ? (
        <span className="rounded-full bg-[#00521d] px-3 py-1 font-heading text-xs font-bold uppercase tracking-[0.1em] text-white">
          Save {saved}
        </span>
      ) : null}
      {!availableForSale ? (
        <span className="rounded-full bg-[#f4e2d4] px-3 py-1 font-heading text-xs font-bold uppercase tracking-[0.1em] text-[#8f440b]">
          Sold out
        </span>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: both exit 0. (The route currently passes only `price`/`compareAtPrice`; `availableForSale` defaults to `true` until Task 11 wires it.)

- [ ] **Step 3: Commit**

```bash
git add app/components/ProductPrice.tsx
git commit -m "Restyle the product price with a savings pill and sold-out tag" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Create QuantitySelector

**Files:**
- Create: `app/components/QuantitySelector.tsx`

**Interfaces:**
- Consumes: `MinusIcon`, `PlusIcon` from `~/components/icons` (both exist after Task 1).
- Produces: `QuantitySelector({value, onChange, min?, max?, disabled?})` — `value: number`, `onChange: (next: number) => void`, `min?: number` (default `1`), `max?: number` (default `99`), `disabled?: boolean`. A controlled −/value/+ stepper.

- [ ] **Step 1: Create the component**

Create `app/components/QuantitySelector.tsx`:

```tsx
import {MinusIcon, PlusIcon} from '~/components/icons';

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00521d]';

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  const button = `grid size-11 place-items-center rounded-full text-[#00521d] transition-colors hover:bg-[#effce9] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent ${FOCUS_RING} motion-reduce:transition-none`;

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-white p-1 ring-1 ring-[#bfe9bb]">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
        className={button}
      >
        <MinusIcon className="size-4" />
      </button>
      <span
        aria-live="polite"
        className="min-w-8 text-center font-heading text-lg font-semibold text-[#004817]"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
        className={button}
      >
        <PlusIcon className="size-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add app/components/QuantitySelector.tsx
git commit -m "Add an accessible quantity stepper" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Add `className` to AddToCartButton and restyle ProductForm

**Files:**
- Modify: `app/components/AddToCartButton.tsx` (add `className` passthrough onto the inner `<button>`)
- Modify (full rewrite): `app/components/ProductForm.tsx`

**Interfaces:**
- Consumes: `AddToCartButton` (now accepts `className`), `QuantitySelector` (Task 4), `ArrowRightIcon` from `~/components/icons`, `useAside`, `MappedProductOptions`, `ProductFragment['selectedOrFirstAvailableVariant']`.
- Produces: `AddToCartButton` gains optional `className?: string`. `ProductForm({productOptions, selectedVariant})` unchanged signature; now owns `quantity` state and renders the option pills + quantity/Add-to-cart row.

- [ ] **Step 1: Add `className` passthrough to AddToCartButton**

In `app/components/AddToCartButton.tsx`, add `className` to the props destructure and type, and pass it to the `<button>`. Replace the whole file:

```tsx
import {type FetcherWithComponents} from 'react-router';
import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';

export function AddToCartButton({
  analytics,
  children,
  className,
  disabled,
  lines,
  onClick,
}: {
  analytics?: unknown;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  lines: Array<OptimisticCartLineInput>;
  onClick?: () => void;
}) {
  return (
    <CartForm route="/cart" inputs={{lines}} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher: FetcherWithComponents<any>) => (
        <>
          <input
            name="analytics"
            type="hidden"
            value={JSON.stringify(analytics)}
          />
          <button
            type="submit"
            onClick={onClick}
            disabled={disabled ?? fetcher.state !== 'idle'}
            className={className}
          >
            {children}
          </button>
        </>
      )}
    </CartForm>
  );
}
```

- [ ] **Step 2: Rewrite ProductForm**

Replace the entire contents of `app/components/ProductForm.tsx`:

```tsx
import {useState} from 'react';
import {Link, useNavigate} from 'react-router';
import {type MappedProductOptions} from '@shopify/hydrogen';
import type {
  Maybe,
  ProductOptionValueSwatch,
} from '@shopify/hydrogen/storefront-api-types';
import {AddToCartButton} from './AddToCartButton';
import {QuantitySelector} from './QuantitySelector';
import {useAside} from './Aside';
import {ArrowRightIcon} from './icons';
import type {ProductFragment} from 'storefrontapi.generated';

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#00521d]';

export function ProductForm({
  productOptions,
  selectedVariant,
}: {
  productOptions: MappedProductOptions[];
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
}) {
  const navigate = useNavigate();
  const {open} = useAside();
  const [quantity, setQuantity] = useState(1);
  const available = Boolean(selectedVariant?.availableForSale);

  return (
    <div className="flex flex-col gap-6">
      {productOptions.map((option) => {
        // Single-value options (e.g. "Default Title") have nothing to choose.
        if (option.optionValues.length === 1) return null;

        return (
          <div key={option.name}>
            <span className="mb-3 block font-heading text-sm font-bold uppercase tracking-[0.16em] text-[#347345]">
              {option.name}
            </span>
            <div className="flex flex-wrap gap-3">
              {option.optionValues.map((value) => {
                const {
                  name,
                  handle,
                  variantUriQuery,
                  selected,
                  available: valueAvailable,
                  exists,
                  isDifferentProduct,
                  swatch,
                } = value;

                const pill = `inline-flex min-h-11 items-center rounded-full px-4 font-heading text-sm font-semibold transition-colors ${FOCUS_RING} ${
                  selected
                    ? 'bg-[#00521d] text-white'
                    : 'text-[#00521d] ring-1 ring-[#bfe9bb] hover:bg-[#effce9]'
                } ${valueAvailable ? '' : 'opacity-40 line-through'} motion-reduce:transition-none`;

                if (isDifferentProduct) {
                  // Combined-listing child that lives at a different URL → anchor.
                  return (
                    <Link
                      key={option.name + name}
                      prefetch="intent"
                      preventScrollReset
                      replace
                      to={`/products/${handle}?${variantUriQuery}`}
                      className={pill}
                    >
                      <ProductOptionSwatch swatch={swatch} name={name} />
                    </Link>
                  );
                }

                return (
                  <button
                    type="button"
                    key={option.name + name}
                    className={pill}
                    disabled={!exists}
                    onClick={() => {
                      if (!selected) {
                        void navigate(`?${variantUriQuery}`, {
                          replace: true,
                          preventScrollReset: true,
                        });
                      }
                    }}
                  >
                    <ProductOptionSwatch swatch={swatch} name={name} />
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-4">
        <QuantitySelector
          value={quantity}
          onChange={setQuantity}
          disabled={!available}
        />
        <AddToCartButton
          disabled={!available}
          onClick={() => open('cart')}
          lines={
            selectedVariant
              ? [{merchandiseId: selectedVariant.id, quantity, selectedVariant}]
              : []
          }
          className={`group inline-flex min-h-14 items-center gap-4 rounded-full bg-primary py-2 pl-8 pr-2 font-heading text-lg font-semibold text-white! shadow-[0_12px_28px_-10px_rgba(169,83,14,0.5)] transition-[transform,box-shadow,background-color] duration-300 hover:-translate-y-0.5 hover:bg-[#8f440b] hover:shadow-[0_20px_38px_-12px_rgba(169,83,14,0.65)] ${FOCUS_RING} disabled:cursor-not-allowed disabled:bg-[#c7bcae] disabled:text-white! disabled:shadow-none disabled:hover:translate-y-0 motion-reduce:transition-none`}
        >
          {available ? 'Add to cart' : 'Sold out'}
          {available ? (
            <span className="relative grid size-10 place-items-center overflow-hidden rounded-full bg-white text-primary">
              <ArrowRightIcon className="size-4 transition-transform duration-300 motion-safe:group-hover:translate-x-[220%]" />
              <ArrowRightIcon className="absolute size-4 -translate-x-[220%] transition-transform duration-300 motion-safe:group-hover:translate-x-0" />
            </span>
          ) : null}
        </AddToCartButton>
      </div>
    </div>
  );
}

function ProductOptionSwatch({
  swatch,
  name,
}: {
  swatch?: Maybe<ProductOptionValueSwatch> | undefined;
  name: string;
}) {
  const image = swatch?.image?.previewImage?.url;
  const color = swatch?.color;

  if (!image && !color) return name;

  return (
    <span
      aria-label={name}
      className="block size-6 overflow-hidden rounded-full"
      style={{backgroundColor: color || 'transparent'}}
    >
      {image ? (
        <img src={image} alt={name} className="size-full rounded-none! object-cover" />
      ) : null}
    </span>
  );
}
```

- [ ] **Step 3: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
git add app/components/AddToCartButton.tsx app/components/ProductForm.tsx
git commit -m "Restyle the buy box with option pills and a quantity row" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Create ProductBreadcrumb

**Files:**
- Create: `app/components/ProductBreadcrumb.tsx`

**Interfaces:**
- Consumes: `Link` from `react-router`.
- Produces: `ProductBreadcrumb({title})` — `title: string`. Renders `Home / Shop / {title}` (`Shop` → `/collections/all`).

- [ ] **Step 1: Create the component**

Create `app/components/ProductBreadcrumb.tsx`:

```tsx
import {Link} from 'react-router';

const LINK =
  'rounded-sm text-[#347345] transition-colors hover:text-[#00752d] hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00521d] motion-reduce:transition-none';

export function ProductBreadcrumb({title}: {title: string}) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm font-medium">
      <ol className="flex flex-wrap items-center gap-2 [&>li]:mb-0">
        <li>
          <Link to="/" className={LINK}>
            Home
          </Link>
        </li>
        <li aria-hidden="true" className="text-[#bfe9bb]">
          /
        </li>
        <li>
          <Link to="/collections/all" className={LINK}>
            Shop
          </Link>
        </li>
        <li aria-hidden="true" className="text-[#bfe9bb]">
          /
        </li>
        <li aria-current="page" className="truncate text-[#004817]">
          {title}
        </li>
      </ol>
    </nav>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add app/components/ProductBreadcrumb.tsx
git commit -m "Add the product breadcrumb nav" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Create ProductPromises

**Files:**
- Create: `app/components/ProductPromises.tsx`

**Interfaces:**
- Consumes: `PawIcon`, `ShieldCheckIcon`, `TruckIcon` from `~/components/icons`.
- Produces: `ProductPromises()` — no props. A static three-item trust strip in a soft rounded card.

- [ ] **Step 1: Create the component**

Create `app/components/ProductPromises.tsx`:

```tsx
import {PawIcon, ShieldCheckIcon, TruckIcon} from '~/components/icons';

const PROMISES = [
  {
    Icon: TruckIcon,
    label: 'Free shipping over $35',
    copy: 'Fast, tracked delivery to your door.',
  },
  {
    Icon: ShieldCheckIcon,
    label: '30-day happy-pet guarantee',
    copy: 'Not a hit? Send it back, no fuss.',
  },
  {
    Icon: PawIcon,
    label: 'Play-tested picks',
    copy: 'Chosen by pets who take toys seriously.',
  },
] as const;

export function ProductPromises() {
  return (
    <ul className="grid gap-3 rounded-[1.5rem] bg-[#effce9] p-4 sm:grid-cols-3">
      {PROMISES.map(({Icon, label, copy}) => (
        <li
          key={label}
          className="mb-0 flex items-start gap-3 sm:flex-col sm:gap-2"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#00521d] ring-1 ring-[#ccefc8]">
            <Icon className="size-5" />
          </span>
          <div>
            <p className="font-heading text-sm font-semibold text-[#004817]">
              {label}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#347345]">{copy}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add app/components/ProductPromises.tsx
git commit -m "Add the product trust-promise strip" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: Create ProductDetails

**Files:**
- Create: `app/components/ProductDetails.tsx`

**Interfaces:**
- Consumes: `ChevronDownIcon` from `~/components/icons`.
- Produces: `ProductDetails({descriptionHtml})` — `descriptionHtml: string`. Renders styled `descriptionHtml` prose plus a two-item native `<details>` accordion with generic copy.

- [ ] **Step 1: Create the component**

Create `app/components/ProductDetails.tsx`. The prose is styled with inline arbitrary-variant utilities (no CSS-file changes) because `reset.css` strips list bullets and sets small type; the `[&_li]:before` dots restore custom bullets.

```tsx
import {ChevronDownIcon} from '~/components/icons';

const SECTIONS = [
  {
    summary: 'Shipping & returns',
    body: 'Orders ship within 1–2 business days with tracking, and shipping is free on orders over $35. Changed your mind? Return any unused item within 30 days for a full refund.',
  },
  {
    summary: 'Care & cleaning',
    body: 'Spot-clean with mild soap and warm water, then air-dry away from direct heat. Check the product tag for any material-specific guidance before washing.',
  },
] as const;

const PROSE =
  'text-[#347345] [&>p]:text-lg [&>p]:leading-relaxed [&>p]:text-[#347345] [&>ul]:mt-5 [&>ul]:flex [&>ul]:flex-col [&>ul]:gap-3 [&_li]:relative [&_li]:mb-0 [&_li]:pl-7 [&_li]:text-base [&_li]:leading-relaxed [&_li]:text-[#347345] [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-[0.55em] [&_li]:before:size-2 [&_li]:before:rounded-full [&_li]:before:bg-[#00752d] [&_li]:before:content-[\'\']';

export function ProductDetails({descriptionHtml}: {descriptionHtml: string}) {
  return (
    <div className="flex flex-col gap-8">
      <div
        className={PROSE}
        dangerouslySetInnerHTML={{__html: descriptionHtml}}
      />
      <div className="flex flex-col divide-y divide-[#e2f2dd] border-y border-[#e2f2dd]">
        {SECTIONS.map(({summary, body}) => (
          <details key={summary} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-heading text-base font-semibold text-[#004817] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00521d] [&::-webkit-details-marker]:hidden">
              {summary}
              <ChevronDownIcon className="size-5 shrink-0 text-[#347345] transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" />
            </summary>
            <p className="pb-5 text-base leading-relaxed text-[#347345]">
              {body}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: both exit 0. If ESLint flags the escaped `content-[\'\']` quotes in the `PROSE` string, switch the outer string quotes to backticks and use `content-['']` unescaped inside the template literal.

- [ ] **Step 3: Commit**

```bash
git add app/components/ProductDetails.tsx
git commit -m "Add product description prose and details accordion" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: Extract the shared RecommendedProduct fragment

**Files:**
- Modify: `app/lib/fragments.ts` (add exported `RECOMMENDED_PRODUCT_FRAGMENT`)
- Modify: `app/routes/_index.tsx` (import the fragment, drop the inline duplicate)

**Interfaces:**
- Consumes: nothing new.
- Produces: `RECOMMENDED_PRODUCT_FRAGMENT` (exported `const` GraphQL string) defining `fragment RecommendedProduct on Product`. The generated type `RecommendedProductFragment` is unchanged (same fields).

- [ ] **Step 1: Add the fragment to `app/lib/fragments.ts`**

Append to the end of `app/lib/fragments.ts` (after `FOOTER_QUERY`):

```ts
// NOTE: Shared product-card shape, consumed by _index.tsx (New Arrivals) and
// products.$handle.tsx (You may also like). Keep in sync with ProductCard.
export const RECOMMENDED_PRODUCT_FRAGMENT = `#graphql
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
` as const;
```

- [ ] **Step 2: Update `app/routes/_index.tsx` to use the shared fragment**

At the top of `app/routes/_index.tsx`, add the import (next to the other `~` imports):

```tsx
import {RECOMMENDED_PRODUCT_FRAGMENT} from '~/lib/fragments';
```

Then replace the entire `RECOMMENDED_PRODUCTS_QUERY` const (the inline `fragment RecommendedProduct … query RecommendedProducts …` block) with:

```tsx
const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
  ${RECOMMENDED_PRODUCT_FRAGMENT}
` as const;
```

- [ ] **Step 3: Regenerate types, typecheck, lint**

Run: `npm run codegen && npm run typecheck && npm run lint`
Expected: codegen succeeds (no "duplicate fragment" error — the fragment is now defined once and interpolated), `storefrontapi.generated.d.ts` still exports `RecommendedProductFragment` and `RecommendedProductsQuery`, both other commands exit 0.

- [ ] **Step 4: Commit**

```bash
git add app/lib/fragments.ts app/routes/_index.tsx
git commit -m "Extract the shared RecommendedProduct fragment into lib" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 10: Create RelatedProducts

**Files:**
- Create: `app/components/RelatedProducts.tsx`

**Interfaces:**
- Consumes: `Suspense` from `react`; `Await` from `react-router`; `ProductCard` from `~/components/ProductCard`; `RecommendedProductFragment` type from `storefrontapi.generated` (exists after Task 9).
- Produces: `RelatedProducts({products})` — `products: Promise<{productRecommendations: RecommendedProductFragment[] | null} | null>`. Renders a full-bleed `#effce9` band with up to 4 `ProductCard`s; renders nothing while pending, on error, or when no recommendations resolve.

Note: the prop is typed **structurally** (not against the query type) so this task does not depend on Task 11's codegen. The route's resolved query type (`ProductRecommendationsQuery`) is structurally assignable to it.

- [ ] **Step 1: Create the component**

Create `app/components/RelatedProducts.tsx`:

```tsx
import {Suspense} from 'react';
import {Await} from 'react-router';
import type {RecommendedProductFragment} from 'storefrontapi.generated';
import {ProductCard} from '~/components/ProductCard';

interface RelatedProductsProps {
  products: Promise<{
    productRecommendations: RecommendedProductFragment[] | null;
  } | null>;
}

export function RelatedProducts({products}: RelatedProductsProps) {
  return (
    <Suspense fallback={null}>
      <Await resolve={products} errorElement={null}>
        {(response) => {
          const recommendations =
            response?.productRecommendations?.slice(0, 4) ?? [];
          if (recommendations.length === 0) return null;

          return (
            <section
              aria-labelledby="related-products-heading"
              className="-mx-4 mt-16 w-[calc(100%+2rem)] overflow-hidden bg-[#effce9] px-6 py-20 lg:mt-24 lg:px-[7vw] lg:py-28"
            >
              <div className="mx-auto max-w-[80rem]">
                <p className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-primary">
                  More to sniff out
                </p>
                <h2
                  id="related-products-heading"
                  className="mb-0 mt-4 max-w-[13ch] font-heading text-4xl font-semibold leading-[0.95] tracking-[-0.05em] text-[#004817] sm:text-5xl"
                >
                  You may also like
                </h2>
                <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:mt-16 lg:grid-cols-4 lg:gap-x-8">
                  {recommendations.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            </section>
          );
        }}
      </Await>
    </Suspense>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: both exit 0. `ProductCard`'s `product` prop is `RecommendedProductFragment`, matching the array element type.

- [ ] **Step 3: Commit**

```bash
git add app/components/RelatedProducts.tsx
git commit -m "Add the you-may-also-like recommendations band" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 11: Rewrite the product route

**Files:**
- Modify (rewrite `meta`, `loader`, default component, and the `PRODUCT_FRAGMENT`; add `PRODUCT_RECOMMENDATIONS_QUERY`): `app/routes/products.$handle.tsx`

**Interfaces:**
- Consumes: all components from Tasks 2–8 and 10 (`ProductImage`, `ProductPrice`, `ProductForm`, `ProductBreadcrumb`, `ProductPromises`, `ProductDetails`, `RelatedProducts`), `PawIcon` from `~/components/icons`, `RECOMMENDED_PRODUCT_FRAGMENT` from `~/lib/fragments` (Task 9), and the Hydrogen product helpers already imported.
- Produces: the finished PDP route. Loader returns `{product, recommended}` where `recommended` is a deferred `Promise<ProductRecommendationsQuery | null>`.

- [ ] **Step 1: Add `featuredImage` to `PRODUCT_FRAGMENT`**

In `app/routes/products.$handle.tsx`, inside `PRODUCT_FRAGMENT` (the `fragment Product on Product { … }`), add a `featuredImage` selection immediately after the `handle` field:

```graphql
    id
    title
    vendor
    handle
    featuredImage {
      id
      url
      altText
      width
      height
    }
    descriptionHtml
    description
```

- [ ] **Step 2: Add the recommendations query**

Add a new query constant at the bottom of the file, after `PRODUCT_QUERY`. It imports the shared fragment — add `import {RECOMMENDED_PRODUCT_FRAGMENT} from '~/lib/fragments';` to the top-of-file imports:

```tsx
const PRODUCT_RECOMMENDATIONS_QUERY = `#graphql
  query ProductRecommendations(
    $country: CountryCode
    $language: LanguageCode
    $productId: ID!
  ) @inContext(country: $country, language: $language) {
    productRecommendations(productId: $productId, intent: RELATED) {
      ...RecommendedProduct
    }
  }
  ${RECOMMENDED_PRODUCT_FRAGMENT}
` as const;
```

- [ ] **Step 3: Rewrite `meta` and `loader`, delete the stale `loadDeferredData`**

Replace the `meta` export with:

```tsx
export const meta: Route.MetaFunction = ({data}) => {
  return [
    {title: `Pawstie | ${data?.product.title ?? ''}`},
    {
      name: 'description',
      content:
        data?.product.seo?.description ?? data?.product.description ?? '',
    },
    {
      rel: 'canonical',
      href: `/products/${data?.product.handle}`,
    },
  ];
};
```

Replace the `loader` function (and remove the now-unused `loadDeferredData`) so recommendations are fetched **after** critical data resolves (they need `product.id`) and returned as a deferred promise:

```tsx
export async function loader(args: Route.LoaderArgs) {
  // Critical data (the product) must resolve before we can render or ask for
  // recommendations, which key off product.id.
  const criticalData = await loadCriticalData(args);

  // Deferred: streamed after first byte. `.catch` keeps a failed query from
  // turning into a 500 — the section just hides.
  const recommended = args.context.storefront
    .query(PRODUCT_RECOMMENDATIONS_QUERY, {
      variables: {productId: criticalData.product.id},
    })
    .catch((error: Error) => {
      console.error(error);
      return null;
    });

  return {...criticalData, recommended};
}
```

Leave `loadCriticalData` as-is.

- [ ] **Step 4: Rewrite the default `Product` component**

Replace the `export default function Product() { … }` body. Note the structure: the top-level `<div>` has **no horizontal padding** (so the `RelatedProducts` full-bleed band reaches the viewport edge); the hero gets its own padded wrapper. Update imports at the top to add `ProductBreadcrumb`, `ProductPromises`, `ProductDetails`, `RelatedProducts`, and `PawIcon`.

```tsx
export default function Product() {
  const {product, recommended} = useLoaderData<typeof loader>();

  // Optimistically selects a variant with given available variant information
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  // Sets the search param to the selected variant without navigation
  // only when no search params are set in the url
  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  // Get the product options array
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const {title, descriptionHtml, vendor} = product;
  const heroImage = selectedVariant?.image ?? product.featuredImage;

  return (
    <div className="pb-4">
      <div className="px-6 pt-8 lg:px-[7vw] lg:pt-12">
        <div className="mx-auto max-w-[80rem]">
          <ProductBreadcrumb title={title} />
          <div className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-2 lg:gap-16">
            <ProductImage image={heroImage} title={title} />
            <div className="flex flex-col gap-7">
              <div>
                <p className="inline-flex items-center gap-2 font-heading text-sm font-bold uppercase tracking-[0.16em] text-[#347345]">
                  <PawIcon className="size-4 text-[#00752d]" />
                  {vendor}
                </p>
                <h1 className="mb-0 mt-3 font-heading text-4xl font-semibold leading-[0.95] tracking-[-0.05em] text-[#004817] sm:text-5xl">
                  {title}
                </h1>
              </div>
              <ProductPrice
                price={selectedVariant?.price}
                compareAtPrice={selectedVariant?.compareAtPrice}
                availableForSale={selectedVariant?.availableForSale}
              />
              <ProductForm
                productOptions={productOptions}
                selectedVariant={selectedVariant}
              />
              <ProductPromises />
              <ProductDetails descriptionHtml={descriptionHtml} />
            </div>
          </div>
        </div>
      </div>

      <RelatedProducts products={recommended} />

      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </div>
  );
}
```

Update the import block at the top of the file to:

```tsx
import {redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/products.$handle';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {ProductPrice} from '~/components/ProductPrice';
import {ProductImage} from '~/components/ProductImage';
import {ProductForm} from '~/components/ProductForm';
import {ProductBreadcrumb} from '~/components/ProductBreadcrumb';
import {ProductPromises} from '~/components/ProductPromises';
import {ProductDetails} from '~/components/ProductDetails';
import {RelatedProducts} from '~/components/RelatedProducts';
import {PawIcon} from '~/components/icons';
import {RECOMMENDED_PRODUCT_FRAGMENT} from '~/lib/fragments';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
```

If `redirect` is now unused (it is not referenced in the rewritten file), remove it from the `react-router` import to keep lint clean — verify in Step 5.

- [ ] **Step 5: Regenerate types, typecheck, lint**

Run: `npm run codegen && npm run typecheck && npm run lint`
Expected: codegen adds `ProductRecommendationsQuery` and `featuredImage` to `ProductFragment` in `storefrontapi.generated.d.ts`; typecheck exits 0 (the resolved `ProductRecommendationsQuery` is structurally assignable to `RelatedProducts`'s `products` prop); lint clean. If typecheck reports the `recommended` promise type is not assignable to `RelatedProducts`, change `RelatedProductsProps.products` in `app/components/RelatedProducts.tsx` to `Promise<ProductRecommendationsQuery | null>` and `import type {ProductRecommendationsQuery} from 'storefrontapi.generated'`.

- [ ] **Step 6: Commit**

```bash
git add app/routes/products.$handle.tsx storefrontapi.generated.d.ts
git commit -m "Rebuild the product details page on the new components" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 12: Remove dead product CSS

**Files:**
- Modify: `app/styles/app.css` (delete the `routes/products.$handle.tsx` block, lines ~397–456)

**Interfaces:**
- Consumes: nothing.
- Produces: no `.product*` selectors remain in `app/styles/app.css`.

- [ ] **Step 1: Delete the dead block**

In `app/styles/app.css`, remove the entire section starting at the comment banner:

```css
/*
* --------------------------------------------------
* routes/products.$handle.tsx
* --------------------------------------------------
*/
```

through the end of the `.product-option-label-swatch img { … }` rule — i.e. every `.product`, `.product h1`, `.product-image img`, `.product-main`, `.product-price-on-sale`, `.product-price-on-sale s`, `.product-options-grid`, `.product-options-item`, `.product-option-label-swatch`, and `.product-option-label-swatch img` rule and their comment banner. Leave the surrounding `routes/collections.$handle.tsx` block (above) and `routes/blog._index.tsx` block (below) intact.

- [ ] **Step 2: Confirm nothing else references those classes**

Run: `grep -rn "product-main\|product-image\|product-options\|product-price-on-sale\|product-option-label-swatch\|className=\"product\"" app/`
Expected: no matches (the rewritten components use Tailwind utilities, not these classes).

- [ ] **Step 3: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
git add app/styles/app.css
git commit -m "Drop the dead product-page CSS the skeleton left behind" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 13: Manual acceptance on the dev server

**Files:** none (verification only).

**Interfaces:**
- Consumes: the finished route and components.
- Produces: a verified, on-brand PDP.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: MiniOxygen serves the storefront (default `http://localhost:3000`); codegen watch reports no errors.

- [ ] **Step 2: Load an in-stock product and verify the hero**

Navigate to a PDP (e.g. the slow-feed bowl at `/products/<handle>` — get a real handle from `/collections/all`). Confirm:
- Breadcrumb reads `Home / Shop / {title}`; `Home` → `/`, `Shop` → `/collections/all`.
- Image sits in the asymmetric `#a4e8aa` frame with the rounded corner intact (no stray 4px `img` radius leaking a square corner).
- Eyebrow shows the paw icon + vendor; `<h1>` is the deep-green heading; price is large and orange.

- [ ] **Step 3: Verify the buy box adds N to cart**

Set the quantity stepper to 3, click **Add to cart**. Confirm the cart aside opens and the line quantity is 3 (not 1). Decrement below 1 is blocked; the `−` button disables at 1.

- [ ] **Step 4: Verify sold-out state**

Load a sold-out product (0 inventory). Confirm the price area shows the `Sold out` tag, the quantity stepper is disabled, and the buy button shows a disabled "Sold out" state (muted, no arrow).

- [ ] **Step 5: Verify accordion, promises, recommendations, and layout**

- Promise strip shows three items with icons.
- Both `<details>` sections open/close; the chevron rotates; no default disclosure triangle is visible.
- "You may also like" band renders up to 4 `ProductCard`s and is full-bleed (touches the viewport edges). On a product with no recommendations, the section is absent (no empty band).
- Resize to mobile width: hero stacks (image over info), buy row wraps cleanly.
- Keyboard-tab through breadcrumb links, option pills (if any), stepper buttons, add-to-cart, and accordion summaries: each shows the deep-green focus ring.

- [ ] **Step 6: Report results**

Summarize what passed and any deviations. If everything passes, the feature is complete on `feature/product-details-page`.

---

## Self-Review

**Spec coverage:**
- Breadcrumb → Task 6 + Task 11. ✅
- Hero image (branded frame, `rounded-none!`, empty fallback) → Task 2. ✅
- Info column eyebrow/title → Task 11. ✅
- Price (large orange, compare-at, Save pill, sold-out) → Task 3. ✅
- Buy box (QuantitySelector + Add-to-cart pill, sold-out disabled) → Tasks 4, 5. ✅
- Promise strip → Task 7. ✅
- Description prose + details accordion → Task 8. ✅
- "You may also like" band (up to 4, hidden if none) → Task 10 + Task 11. ✅
- Restyled option pills (selected/available/unavailable) → Task 5. ✅
- `AddToCartButton` `className` passthrough → Task 5. ✅
- `featuredImage` on `PRODUCT_FRAGMENT` → Task 11. ✅
- Deferred `productRecommendations(intent: RELATED)` with `.catch(() => null)` → Task 11. ✅
- Shared `RecommendedProduct` fragment moved to `lib/fragments.ts`, used in both routes → Task 9 + Task 11. ✅
- `meta` fix (`Pawstie | {title}`, seo/description, canonical) → Task 11. ✅
- Icons (`TruckIcon`, `ShieldCheckIcon`, `MinusIcon`, `ChevronDownIcon`) → Task 1. ✅
- Cleanup of dead `.product*` CSS → Task 12. ✅
- Verification (codegen/typecheck/lint + browser drive) → per-task gates + Task 13. ✅
- `Analytics.ProductView` retained → Task 11. ✅

**Placeholder scan:** No TBD/TODO; every code step shows complete code. Copy for promises and accordion is finalized (generic, per spec). ✅

**Type consistency:** `QuantitySelector({value, onChange, min?, max?, disabled?})` defined in Task 4 and consumed identically in Task 5. `AddToCartButton` `className?` added in Task 5 and used in Task 5. `ProductImage({image, title?})` from Task 2 matches the Task 11 call. `ProductPrice({price?, compareAtPrice?, availableForSale?})` from Task 3 matches the Task 11 call. `RelatedProducts({products})` structural prop from Task 10 matches the deferred `recommended` from Task 11 (with a documented contingency). `RECOMMENDED_PRODUCT_FRAGMENT` defined once in Task 9, interpolated in `_index.tsx` (Task 9) and the route (Task 11). ✅

**Scope:** Single subsystem (one route + its components). No decomposition needed. ✅
