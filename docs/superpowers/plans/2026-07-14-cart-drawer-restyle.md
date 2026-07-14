# Cart Drawer Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the cart drawer into a branded three-part flex column — pinned header, independently scrolling list of mint line-item cards, welded-on deep-green footer with a real checkout button.

**Architecture:** The shared `Aside` shell moves from bare `app.css` element selectors to Tailwind, gains real focus management, and becomes a flex column whose `<main>` lets children own their own scrolling. `CartMain` slots into that: a scrolling `<ul>` of `CartLineItem` mint cards plus a `flex-none` `CartSummary` green block. The corresponding `app.css` rules are deleted in the same task that replaces them, so the app is never broken between tasks.

**Tech Stack:** Hydrogen 2026.4.3, React Router 7, Tailwind v4, TypeScript.

Spec: `docs/superpowers/specs/2026-07-14-cart-drawer-restyle-design.md`

## Global Constraints

- **No test runner exists in this repo.** CLAUDE.md is explicit: no `test` script, no test files. Do **not** add one. Every task's verification is `npm run lint && npm run typecheck` plus a specific thing to look at in `npm run dev`. Where a step says "look at", actually look — do not claim it passed without observing it.
- **Never touch `app/styles/tailwind.css`.** The user owns the theme.
- Greens are arbitrary Tailwind values (`#00521d`, `#004817`, `#a4e8aa`, `#eaf7ea`); **orange is the `primary` token** (`bg-primary` / `text-primary-foreground`).
- **Orange discipline:** orange appears exactly twice in the drawer — the line price and the checkout button. Nowhere else.
- Import routing from `react-router`. Never `@remix-run/*`, never `react-router-dom`.
- `img { border-radius: 4px }` at `app.css:11` is **unlayered**, so it beats Tailwind's layered utilities. Any radius on an `<Image>` needs `!` (e.g. `rounded-xl!`). `ProductCard.tsx:34` already does this.
- Use `cn()` from `~/lib/utils` for conditional classes.
- Commit after every task.

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `app/components/Aside.tsx` | Drawer shell: chrome, overlay, open/close, focus management | Rewrite |
| `app/components/icons.tsx` | Icon set | Add `CloseIcon` |
| `app/components/CartMain.tsx` | Cart column layout + empty state | Rewrite |
| `app/components/CartLineItem.tsx` | One line: mint card, stepper, remove | Rewrite |
| `app/components/CartSummary.tsx` | Green footer: subtotal, checkout, codes disclosure | Rewrite |
| `app/components/PageLayout.tsx` | Passes a live item count into the cart heading | Modify |
| `app/styles/app.css` | Global styles | Delete superseded rules |

---

### Task 1: Aside shell — Tailwind chrome + focus management

The shell is shared with the **mobile menu**. This task changes both.

**Files:**
- Modify: `app/components/icons.tsx` (add `CloseIcon`)
- Rewrite: `app/components/Aside.tsx`
- Modify: `app/styles/app.css` (delete `aside` + `.overlay` rules, and `--aside-width`)

**Interfaces:**
- Consumes: nothing.
- Produces: `Aside` renders `<main className="flex min-h-0 flex-1 flex-col">` — **Task 2 relies on this**, it's what lets the cart list scroll independently. `Aside`'s public props (`children`, `heading: React.ReactNode`, `type`) are unchanged, so `PageLayout` and `Header` keep working untouched. `useAside()` still returns `{type, open, close}`; `open` and `close` are now referentially stable (`useCallback`).

- [ ] **Step 1: Add `CloseIcon` to `app/components/icons.tsx`**

Append to the file (it follows the existing `IconProps` pattern):

```tsx
export function CloseIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
```

- [ ] **Step 2: Rewrite `app/components/Aside.tsx`**

Full file:

```tsx
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import {CloseIcon} from '~/components/icons';
import {cn} from '~/lib/utils';

type AsideType = 'search' | 'cart' | 'mobile' | 'closed';
type AsideContextValue = {
  type: AsideType;
  open: (mode: AsideType) => void;
  close: () => void;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A slide-in drawer with an overlay. Shared by the cart and the mobile menu.
 * @example
 * ```jsx
 * <Aside type="cart" heading="Your cart">…</Aside>
 * ```
 */
export function Aside({
  children,
  heading,
  type,
}: {
  children?: React.ReactNode;
  type: AsideType;
  heading: React.ReactNode;
}) {
  const {type: activeType, close} = useAside();
  const expanded = type === activeType;
  const id = useId();
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!expanded) return;

    const abortController = new AbortController();
    const panel = panelRef.current;

    // Lock the page behind the drawer. This replaces the deleted
    // `html:has(.overlay.expanded) { overflow: hidden }` rule — which only
    // locked below 45em. Locking at every width is the behaviour we want.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    panel?.focus();

    document.addEventListener(
      'keydown',
      function handler(event: KeyboardEvent) {
        if (event.key === 'Escape') {
          close();
          return;
        }
        if (event.key !== 'Tab' || !panel) return;

        // Trap Tab inside the panel. Recomputed per keypress because the cart's
        // contents change as lines are added and removed.
        const focusables = Array.from(
          panel.querySelectorAll<HTMLElement>(FOCUSABLE),
        );
        if (focusables.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        if (event.shiftKey && (active === first || active === panel)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      },
      {signal: abortController.signal},
    );

    return () => {
      abortController.abort();
      document.body.style.overflow = previousOverflow;
    };
  }, [close, expanded]);

  return (
    <div
      aria-hidden={!expanded}
      className={cn(
        'fixed inset-0 z-[60] bg-black/30 transition-opacity duration-300 ease-out',
        expanded
          ? 'visible opacity-100'
          : 'invisible opacity-0 pointer-events-none',
      )}
    >
      {/* Click-outside target. Sits under the panel in paint order, so clicks on
          the panel itself never reach it. tabIndex -1 keeps it out of the trap. */}
      <button
        aria-label="Close"
        className="absolute inset-0 size-full cursor-default"
        onClick={close}
        tabIndex={-1}
        type="button"
      />
      <aside
        aria-labelledby={id}
        aria-modal="true"
        className={cn(
          'absolute right-0 top-0 flex h-dvh w-full flex-col bg-white shadow-[0_0_60px_rgba(0,0,0,0.25)] outline-none',
          'transition-transform duration-300 ease-out motion-reduce:transition-none',
          'sm:w-[28rem] sm:rounded-l-[1.75rem]',
          expanded ? 'translate-x-0' : 'translate-x-full',
        )}
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="flex flex-none items-start justify-between px-5 pb-3 pt-5">
          <h3
            className="m-0 font-heading text-lg font-extrabold tracking-[-0.02em] text-[#004817]"
            id={id}
          >
            {heading}
          </h3>
          <button
            aria-label="Close"
            className="grid size-9 flex-none place-items-center rounded-full bg-[#eef3ee] text-[#004817] transition-colors hover:bg-[#dfe9e0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00521d]"
            onClick={close}
            type="button"
          >
            <CloseIcon className="size-4" />
          </button>
        </header>
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </aside>
    </div>
  );
}

const AsideContext = createContext<AsideContextValue | null>(null);

Aside.Provider = function AsideProvider({children}: {children: ReactNode}) {
  const [type, setType] = useState<AsideType>('closed');
  const triggerRef = useRef<HTMLElement | null>(null);

  const open = useCallback((mode: AsideType) => {
    if (mode !== 'closed') {
      triggerRef.current = document.activeElement as HTMLElement | null;
    }
    setType(mode);
  }, []);

  const close = useCallback(() => {
    setType('closed');
    // The trigger can vanish while the drawer is open — removing the last cart
    // line unmounts CartFab, which is what opened it. Focusing a detached node
    // silently drops focus to <body>, so check before restoring.
    if (triggerRef.current?.isConnected) {
      triggerRef.current.focus();
    }
    triggerRef.current = null;
  }, []);

  return (
    <AsideContext.Provider value={{type, open, close}}>
      {children}
    </AsideContext.Provider>
  );
};

export function useAside() {
  const aside = useContext(AsideContext);
  if (!aside) {
    throw new Error('useAside must be used within an AsideProvider');
  }
  return aside;
}
```

- [ ] **Step 3: Delete the superseded rules from `app/styles/app.css`**

Delete **three non-contiguous** things. **Do NOT delete `.sr-only`** — it sits *between* the two aside ranges and is used across the app.

1. `--aside-width: 400px;` (line 2) from the `:root` block.
2. The whole `aside { … }` group — from `aside {` through the `aside li { … }` rule (lines ~87-142). Also delete the `@media (max-width: 45em) { html:has(.overlay.expanded) { overflow: hidden; } }` block above it (lines ~81-85) — **the effect in Step 2 replaces it.** That rule keyed off the `.overlay` class, which no longer exists in the new markup, so it would be dead code either way; the `document.body.style.overflow` lock is its replacement and applies at every width, not just below 45em.
3. The whole `.overlay { … }` group — from `.overlay {` through `.overlay.expanded aside { … }` (lines ~156-201).

Keep `button.reset` (~line 203) — it is used elsewhere.

- [ ] **Step 4: Verify**

```bash
npm run lint && npm run typecheck
```
Expected: both clean.

Then `npm run dev` and look at it:
- Cart drawer opens with the new white rounded panel, circular × button.
- **The mobile menu drawer** (narrow the viewport, tap the hamburger) — it uses the same shell. It must look right, not broken.
- Escape closes. Click outside closes.
- **The page behind does not scroll while the drawer is open**, and scrolling is restored after it closes (scroll the page, open the drawer, try to scroll, close it, scroll again).
- Open the cart with the keyboard: focus lands in the panel, Tab cycles inside it and does not escape to the page behind, Escape returns focus to the button you opened it from.

- [ ] **Step 5: Commit**

```bash
git add app/components/Aside.tsx app/components/icons.tsx app/styles/app.css
git commit -m "Restyle the Aside shell and give it real focus management"
```

---

### Task 2: CartMain — flex column, scrolling list, empty state

**Files:**
- Rewrite: `app/components/CartMain.tsx`
- Modify: `app/styles/app.css` (delete `.cart-main`, `.cart-main.with-discount`, and both height vars)

**Interfaces:**
- Consumes: `Aside`'s `<main className="flex min-h-0 flex-1 flex-col">` from Task 1.
- Produces: the scrolling `<ul>` that `CartLineItem` (Task 3) renders into, and the `flex-none` slot at the bottom that `CartSummary` (Task 4) fills. `CartMain`'s props (`{cart, layout}`) and the exported `CartLayout` / `LineItemChildrenMap` types are unchanged.

**Two bugs to fix while here, both pre-existing:**
- `id="cart-lines"` is a hardcoded string. `PageLayout` always mounts the cart aside, so on `/cart` that ID renders **twice** — duplicate IDs break the `aria-labelledby`. Use `useId()`.
- `CartEmpty` takes a `layout` prop it never reads. Drop it.

- [ ] **Step 1: Rewrite `app/components/CartMain.tsx`**

`getLineItemChildrenMap` is unchanged — keep it exactly as-is. Replace `CartMain` and `CartEmpty`:

```tsx
import {useOptimisticCart} from '@shopify/hydrogen';
import {useId} from 'react';
import {Link} from 'react-router';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {CartLineItem, type CartLine} from '~/components/CartLineItem';
import {PawIcon} from '~/components/icons';
import {cn} from '~/lib/utils';
import {CartSummary} from './CartSummary';

export type CartLayout = 'page' | 'aside';

export type CartMainProps = {
  cart: CartApiQueryFragment | null;
  layout: CartLayout;
};

export type LineItemChildrenMap = {[parentId: string]: CartLine[]};

// … getLineItemChildrenMap unchanged …

/**
 * The main cart component that displays the cart items and summary.
 * It is used by both the /cart route and the cart aside dialog.
 */
export function CartMain({layout, cart: originalCart}: CartMainProps) {
  // The useOptimisticCart hook applies pending actions to the cart
  // so the user immediately sees feedback when they modify the cart.
  const cart = useOptimisticCart(originalCart);
  const linesId = useId();
  const isAside = layout === 'aside';

  const lines = cart?.lines?.nodes ?? [];
  const childrenMap = getLineItemChildrenMap(lines);

  if (lines.length === 0) {
    return <CartEmpty />;
  }

  return (
    <section
      aria-label={isAside ? 'Cart drawer' : 'Cart page'}
      className={cn(isAside && 'flex min-h-0 flex-1 flex-col')}
    >
      <p className="sr-only" id={linesId}>
        Line items
      </p>
      <ul
        aria-labelledby={linesId}
        className={cn(
          'flex list-none flex-col gap-3',
          isAside && 'min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2',
        )}
      >
        {lines.map((line) => {
          // we do not render non-parent lines at the root of the cart
          if ('parentRelationship' in line && line.parentRelationship?.parent) {
            return null;
          }
          return (
            <CartLineItem
              childrenMap={childrenMap}
              key={line.id}
              layout={layout}
              line={line}
            />
          );
        })}
      </ul>
      <CartSummary cart={cart} layout={layout} />
    </section>
  );
}

function CartEmpty() {
  const {close} = useAside();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 pb-16 text-center">
      <div className="grid size-20 place-items-center rounded-full bg-[#a4e8aa]">
        <PawIcon className="size-9 text-[#00521d]" />
      </div>
      <h3 className="mt-5 font-heading text-lg font-extrabold tracking-[-0.02em] text-[#004817]">
        Your cart is empty
      </h3>
      <p className="mt-1.5 text-sm text-[#5c7060]">
        Nothing here yet — let&rsquo;s find something your pet will love.
      </p>
      <Link
        className="mt-6 rounded-full bg-primary px-6 py-3 font-heading text-sm font-extrabold text-primary-foreground no-underline transition-colors hover:bg-primary/90 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00521d]"
        onClick={close}
        prefetch="viewport"
        to="/collections"
      >
        Start shopping
      </Link>
    </div>
  );
}
```

Note the old `cartHasItems` guard around `<CartSummary>` is gone — it was redundant. We early-return above when there are no lines, so by the time we reach the summary there is always at least one.

- [ ] **Step 2: Delete the superseded rules from `app/styles/app.css`**

- `--cart-aside-summary-height-with-discount: 300px;` and `--cart-aside-summary-height: 250px;` (lines 3-4).
- The `.cart-main { … }` and `.cart-main.with-discount { … }` rules (~lines 402-411).

- [ ] **Step 3: Verify**

```bash
npm run lint && npm run typecheck
```
Expected: both clean.

`npm run dev`, then look:
- Add several items until the list overflows. **The list scrolls on its own; the header stays pinned.** (Lines will still be unstyled — that's Task 3.)
- Remove every line → the paw empty state appears, "Start shopping" closes the drawer and goes to `/collections`.
- Load `/cart` directly → the page still renders and is not visually broken.

- [ ] **Step 4: Commit**

```bash
git add app/components/CartMain.tsx app/styles/app.css
git commit -m "Give the cart a real scrolling column and a proper empty state"
```

---

### Task 3: CartLineItem — the mint card

**Files:**
- Rewrite: `app/components/CartLineItem.tsx`
- Modify: `app/styles/app.css` (delete `.cart-line`, `.cart-line-inner`, `.cart-line img`, `.cart-line-quantity`, `.cart-line-children`)

**Interfaces:**
- Consumes: the `<ul>` slot from Task 2; `CartLine` type (exported from this file, unchanged).
- Produces: `CartLineItem({layout, line, childrenMap})` — signature unchanged. Still exports `type CartLine`.

**Watch out — `CartForm` renders a real `<form>` element** wrapping its children and takes no `className`. So in the stepper, the flex items are the *forms*, not the buttons. Layout must survive that. (This is the trap recorded in memory: hit-testing uses the box, not the pixels.)

**`ProductPrice` takes no `className`**, so render `<Money>` directly rather than widening a shared component's API for a styling need.

- [ ] **Step 1: Rewrite `app/components/CartLineItem.tsx`**

```tsx
import type {CartLineUpdateInput} from '@shopify/hydrogen/storefront-api-types';
import type {CartLayout, LineItemChildrenMap} from '~/components/CartMain';
import {
  CartForm,
  Image,
  Money,
  type OptimisticCartLine,
} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {Link} from 'react-router';
import {useAside} from './Aside';
import {cn} from '~/lib/utils';
import type {
  CartApiQueryFragment,
  CartLineFragment,
} from 'storefrontapi.generated';

export type CartLine = OptimisticCartLine<CartApiQueryFragment>;

/**
 * A single line item in the cart. It displays the product image, title, price.
 * It also provides controls to update the quantity or remove the line item.
 * If the line is a parent line that has child components (like warranties or gift wrapping), they are
 * rendered nested below the parent line.
 */
export function CartLineItem({
  layout,
  line,
  childrenMap,
}: {
  layout: CartLayout;
  line: CartLine;
  childrenMap: LineItemChildrenMap;
}) {
  const {id, merchandise, isOptimistic} = line;
  const {product, title, image, selectedOptions} = merchandise;
  const lineItemUrl = useVariantUrl(product.handle, selectedOptions);
  const {close} = useAside();
  const lineItemChildren = childrenMap[id];
  const childrenLabelId = `cart-line-children-${id}`;

  // Shopify emits {name: 'Title', value: 'Default Title'} for every product that
  // has no real variants. It is not an option the customer chose — never show it.
  const options = selectedOptions.filter(
    (option) => option.value !== 'Default Title',
  );

  return (
    <li
      className={cn(
        'list-none transition-opacity',
        isOptimistic && 'pointer-events-none opacity-60',
      )}
      key={id}
    >
      <div className="flex gap-3 rounded-[1.25rem] rounded-br-[2.5rem] bg-[#eaf7ea] p-3">
        {image && (
          <Image
            alt={title}
            aspectRatio="1/1"
            className="size-[62px] flex-none rounded-xl! bg-[#a4e8aa] object-cover"
            data={image}
            height={124}
            loading="lazy"
            sizes="62px"
            width={124}
          />
        )}

        <div className="min-w-0 flex-1">
          <Link
            className="font-heading text-sm font-bold leading-snug tracking-[-0.01em] text-[#004817] hover:text-[#00752d] hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00521d]"
            onClick={() => {
              if (layout === 'aside') {
                close();
              }
            }}
            prefetch="intent"
            to={lineItemUrl}
          >
            {product.title}
          </Link>

          {options.length > 0 && (
            <ul className="mt-1 flex list-none flex-wrap gap-x-2">
              {options.map((option) => (
                <li className="text-xs text-[#5c7060]" key={option.name}>
                  {option.name}: {option.value}
                </li>
              ))}
            </ul>
          )}

          {line?.cost?.totalAmount && (
            <p className="mt-1 font-heading text-sm font-extrabold text-primary">
              <Money as="span" data={line.cost.totalAmount} />
            </p>
          )}

          <CartLineQuantity line={line} />
        </div>
      </div>

      {lineItemChildren ? (
        <div>
          <p className="sr-only" id={childrenLabelId}>
            Line items with {product.title}
          </p>
          <ul
            aria-labelledby={childrenLabelId}
            className="mt-2 flex list-none flex-col gap-2 pl-6"
          >
            {lineItemChildren.map((childLine) => (
              <CartLineItem
                childrenMap={childrenMap}
                key={childLine.id}
                layout={layout}
                line={childLine}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
}

/**
 * Provides the controls to update the quantity of a line item in the cart.
 * These controls are disabled when the line item is new, and the server
 * hasn't yet responded that it was successfully added to the cart.
 */
function CartLineQuantity({line}: {line: CartLine}) {
  if (!line || typeof line?.quantity === 'undefined') return null;
  const {id: lineId, quantity, isOptimistic} = line;
  const prevQuantity = Number(Math.max(0, quantity - 1).toFixed(0));
  const nextQuantity = Number((quantity + 1).toFixed(0));

  return (
    <div className="mt-2.5 flex items-center gap-3">
      {/* CartForm renders a <form> around each button, so the forms are the flex
          items here — not the buttons. */}
      <div className="inline-flex items-center rounded-full border border-[#cbe0ce] bg-white">
        <CartLineUpdateButton lines={[{id: lineId, quantity: prevQuantity}]}>
          <button
            aria-label="Decrease quantity"
            className={STEPPER_BUTTON}
            disabled={quantity <= 1 || !!isOptimistic}
            name="decrease-quantity"
            value={prevQuantity}
          >
            <span aria-hidden>&#8722;</span>
          </button>
        </CartLineUpdateButton>

        <span className="w-6 text-center font-heading text-xs font-extrabold text-[#004817]">
          {quantity}
        </span>

        <CartLineUpdateButton lines={[{id: lineId, quantity: nextQuantity}]}>
          <button
            aria-label="Increase quantity"
            className={STEPPER_BUTTON}
            disabled={!!isOptimistic}
            name="increase-quantity"
            value={nextQuantity}
          >
            <span aria-hidden>&#43;</span>
          </button>
        </CartLineUpdateButton>
      </div>

      <CartLineRemoveButton disabled={!!isOptimistic} lineIds={[lineId]} />
    </div>
  );
}

const STEPPER_BUTTON =
  'grid size-7 place-items-center rounded-full text-base font-bold leading-none text-[#00521d] transition-colors hover:bg-[#eaf7ea] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#00521d] disabled:opacity-35 disabled:hover:bg-transparent';

/**
 * A button that removes a line item from the cart. It is disabled
 * when the line item is new, and the server hasn't yet responded
 * that it was successfully added to the cart.
 */
function CartLineRemoveButton({
  lineIds,
  disabled,
}: {
  lineIds: string[];
  disabled: boolean;
}) {
  return (
    <CartForm
      action={CartForm.ACTIONS.LinesRemove}
      fetcherKey={getUpdateKey(lineIds)}
      inputs={{lineIds}}
      route="/cart"
    >
      <button
        className="text-xs font-semibold text-[#6d8070] underline underline-offset-2 transition-colors hover:text-[#00521d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00521d] disabled:opacity-40"
        disabled={disabled}
        type="submit"
      >
        Remove
      </button>
    </CartForm>
  );
}

function CartLineUpdateButton({
  children,
  lines,
}: {
  children: React.ReactNode;
  lines: CartLineUpdateInput[];
}) {
  const lineIds = lines.map((line) => line.id);

  return (
    <CartForm
      action={CartForm.ACTIONS.LinesUpdate}
      fetcherKey={getUpdateKey(lineIds)}
      inputs={{lines}}
      route="/cart"
    >
      {children}
    </CartForm>
  );
}

/**
 * Returns a unique key for the update action. This is used to make sure actions modifying the same line
 * items are not run concurrently, but cancel each other. For example, if the user clicks "Increase quantity"
 * and "Decrease quantity" in rapid succession, the actions will cancel each other and only the last one will run.
 * @param lineIds - line ids affected by the update
 * @returns
 */
function getUpdateKey(lineIds: string[]) {
  return [CartForm.ACTIONS.LinesUpdate, ...lineIds].join('-');
}
```

If `CartLineFragment` ends up unused after this rewrite, delete it from the import — `lint` will tell you.

- [ ] **Step 2: Delete the superseded rules from `app/styles/app.css`**

`.cart-line`, `.cart-line-inner`, `.cart-line img`, `.cart-line-quantity`, and `.cart-line-children` (~lines 413-447). Leave `.cart-summary-page` / `.cart-summary-aside` / `.cart-discount` / `.cart-subtotal` alone — Task 4 removes those.

- [ ] **Step 3: Verify**

```bash
npm run lint && npm run typecheck
```
Expected: both clean.

`npm run dev`, then look:
- Line is a mint card with the fat bottom-right corner. Thumbnail is properly rounded — **if it renders with a 4px radius, the `!` on `rounded-xl` is missing.**
- A single-variant product shows **no "Title: Default Title"**.
- Stepper − / + work; − is disabled at quantity 1; the card dims mid-update.
- The stepper pill is not stretched or broken by the wrapping `<form>` elements.
- "Remove" sits beside the stepper, clear of the fat corner.

- [ ] **Step 4: Commit**

```bash
git add app/components/CartLineItem.tsx app/styles/app.css
git commit -m "Restyle cart lines as mint cards with a real quantity stepper"
```

---

### Task 4: CartSummary — green footer, checkout button, codes disclosure

**Files:**
- Rewrite: `app/components/CartSummary.tsx`
- Modify: `app/styles/app.css` (delete `.cart-summary-page`, `.cart-summary-aside`, `.cart-discount`, `.cart-subtotal`)

**Interfaces:**
- Consumes: the `flex-none` bottom slot from Task 2; `ArrowRightIcon` from `~/components/icons` (already exists).
- Produces: `CartSummary({cart, layout})` — signature unchanged.

**Design decision to carry out:** the green block renders for **both** layouts. Only the outer shape differs — the drawer gets `rounded-tl-[2.25rem]` and sits flush at the bottom; `/cart` gets a plain rounded card. The alternative (green only in the drawer) meant conditionally recolouring every label, hint, input, and chip inside it, because `text-[#bfe6c5]` on white is invisible. One block, two outer shapes, is far less to get wrong — and it leaves `/cart` looking intentional rather than half-migrated.

**Preserve the gift-card focus-restore logic verbatim.** The `removedCardIndex` / `previousCardIdsRef` / `removeButtonRefs` machinery in the current file is *behavior*, not styling — it moves focus sensibly after a gift card is removed. Keep it exactly as-is; only its markup changes.

- [ ] **Step 1: Rewrite `app/components/CartSummary.tsx`**

```tsx
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {CartLayout} from '~/components/CartMain';
import {CartForm, Money, type OptimisticCart} from '@shopify/hydrogen';
import {useEffect, useId, useRef, useState} from 'react';
import {useFetcher} from 'react-router';
import {ArrowRightIcon} from '~/components/icons';
import {cn} from '~/lib/utils';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
};

const FIELD =
  'w-full rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

const APPLY_BUTTON =
  'flex-none rounded-full bg-white/15 px-4 py-2.5 font-heading text-xs font-extrabold text-white transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50';

const CHIP_REMOVE =
  'text-xs font-semibold text-white/70 underline underline-offset-2 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

export function CartSummary({cart, layout}: CartSummaryProps) {
  const isAside = layout === 'aside';
  const summaryId = useId();
  const codesPanelId = useId();
  const discountsHeadingId = useId();
  const discountCodeInputId = useId();
  const giftCardHeadingId = useId();
  const giftCardInputId = useId();

  const appliedDiscounts =
    cart?.discountCodes?.filter((discount) => discount.applicable) ?? [];
  const appliedGiftCards = cart?.appliedGiftCards ?? [];
  const hasCodes = appliedDiscounts.length > 0 || appliedGiftCards.length > 0;

  const [codesOpen, setCodesOpen] = useState(hasCodes);

  // A code applied from anywhere (including the /cart page in another tab)
  // should never be hidden behind a collapsed disclosure.
  useEffect(() => {
    if (hasCodes) setCodesOpen(true);
  }, [hasCodes]);

  return (
    <div
      aria-labelledby={summaryId}
      className={cn(
        'flex-none bg-[#00521d] px-5 pt-5 text-white',
        isAside
          ? 'mt-2 rounded-tl-[2.25rem] pb-[calc(1.25rem+env(safe-area-inset-bottom))]'
          : 'mt-6 rounded-2xl pb-5',
      )}
    >
      <h4 className="sr-only" id={summaryId}>
        Order summary
      </h4>

      <dl className="m-0 flex items-baseline justify-between">
        <dt className="text-sm font-bold text-[#bfe6c5]">Subtotal</dt>
        <dd className="m-0 font-heading text-xl font-extrabold tracking-[-0.02em]">
          {cart?.cost?.subtotalAmount?.amount ? (
            <Money data={cart.cost.subtotalAmount} />
          ) : (
            '—'
          )}
        </dd>
      </dl>

      <p className="mt-1 text-[0.6875rem] text-[#8fc99a]">
        Shipping &amp; taxes calculated at checkout
      </p>

      <CartCheckoutActions checkoutUrl={cart?.checkoutUrl} />

      <button
        aria-controls={codesPanelId}
        aria-expanded={codesOpen}
        className="mx-auto mt-3 block font-heading text-xs font-extrabold text-[#a4e8aa] underline underline-offset-2 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        onClick={() => setCodesOpen((open) => !open)}
        type="button"
      >
        Have a discount or gift card?
      </button>

      <div className="mt-4 flex flex-col gap-4" hidden={!codesOpen} id={codesPanelId}>
        <CartDiscounts
          appliedDiscounts={appliedDiscounts}
          discountCodeInputId={discountCodeInputId}
          discountsHeadingId={discountsHeadingId}
        />
        <CartGiftCard
          giftCardCodes={cart?.appliedGiftCards}
          giftCardHeadingId={giftCardHeadingId}
          giftCardInputId={giftCardInputId}
        />
      </div>
    </div>
  );
}

function CartCheckoutActions({checkoutUrl}: {checkoutUrl?: string}) {
  if (!checkoutUrl) return null;

  return (
    <a
      className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-3.5 font-heading text-sm font-extrabold text-primary-foreground no-underline transition-colors hover:bg-primary/90 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      href={checkoutUrl}
      target="_self"
    >
      Checkout
      <ArrowRightIcon className="size-4" />
    </a>
  );
}

function CartDiscounts({
  appliedDiscounts,
  discountsHeadingId,
  discountCodeInputId,
}: {
  appliedDiscounts: CartApiQueryFragment['discountCodes'];
  discountsHeadingId: string;
  discountCodeInputId: string;
}) {
  const codes: string[] = appliedDiscounts.map(({code}) => code);

  return (
    <section aria-label="Discounts">
      {codes.length > 0 && (
        <dl className="m-0 mb-2">
          <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-[#8fc99a]" id={discountsHeadingId}>
            Discount
          </dt>
          <UpdateDiscountForm>
            <dd
              aria-labelledby={discountsHeadingId}
              className="m-0 mt-1.5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5"
              role="group"
            >
              <code className="font-heading text-xs font-extrabold text-[#a4e8aa]">
                {codes.join(', ')}
              </code>
              <button aria-label="Remove discount" className={CHIP_REMOVE} type="submit">
                Remove
              </button>
            </dd>
          </UpdateDiscountForm>
        </dl>
      )}

      <UpdateDiscountForm discountCodes={codes}>
        <div className="flex gap-2">
          <label className="sr-only" htmlFor={discountCodeInputId}>
            Discount code
          </label>
          <input
            className={FIELD}
            id={discountCodeInputId}
            name="discountCode"
            placeholder="Discount code"
            type="text"
          />
          <button aria-label="Apply discount code" className={APPLY_BUTTON} type="submit">
            Apply
          </button>
        </div>
      </UpdateDiscountForm>
    </section>
  );
}

function UpdateDiscountForm({
  discountCodes,
  children,
}: {
  discountCodes?: string[];
  children: React.ReactNode;
}) {
  return (
    <CartForm
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{discountCodes: discountCodes || []}}
      route="/cart"
    >
      {children}
    </CartForm>
  );
}

function CartGiftCard({
  giftCardCodes,
  giftCardHeadingId,
  giftCardInputId,
}: {
  giftCardCodes: CartApiQueryFragment['appliedGiftCards'] | undefined;
  giftCardHeadingId: string;
  giftCardInputId: string;
}) {
  const giftCardCodeInput = useRef<HTMLInputElement>(null);
  const removeButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const previousCardIdsRef = useRef<string[]>([]);
  const giftCardAddFetcher = useFetcher({key: 'gift-card-add'});
  const [removedCardIndex, setRemovedCardIndex] = useState<number | null>(null);

  useEffect(() => {
    if (giftCardAddFetcher.data) {
      if (giftCardCodeInput.current !== null) {
        giftCardCodeInput.current.value = '';
      }
    }
  }, [giftCardAddFetcher.data]);

  useEffect(() => {
    const currentCardIds = giftCardCodes?.map((card) => card.id) || [];

    if (removedCardIndex !== null && giftCardCodes) {
      const focusTargetIndex = Math.min(
        removedCardIndex,
        giftCardCodes.length - 1,
      );
      const focusTargetCard = giftCardCodes[focusTargetIndex];
      const focusButton = focusTargetCard
        ? removeButtonRefs.current.get(focusTargetCard.id)
        : null;

      if (focusButton) {
        focusButton.focus();
      } else if (giftCardCodeInput.current) {
        giftCardCodeInput.current.focus();
      }

      setRemovedCardIndex(null);
    }

    previousCardIdsRef.current = currentCardIds;
  }, [giftCardCodes, removedCardIndex]);

  const handleRemoveClick = (cardId: string) => {
    const index = previousCardIdsRef.current.indexOf(cardId);
    if (index !== -1) {
      setRemovedCardIndex(index);
    }
  };

  return (
    <section aria-label="Gift cards">
      {giftCardCodes && giftCardCodes.length > 0 && (
        <dl className="m-0 mb-2">
          <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-[#8fc99a]" id={giftCardHeadingId}>
            Applied gift card(s)
          </dt>
          {giftCardCodes.map((giftCard) => (
            <dd
              className="m-0 mt-1.5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5"
              key={giftCard.id}
            >
              <RemoveGiftCardForm
                buttonRef={(el: HTMLButtonElement | null) => {
                  if (el) {
                    removeButtonRefs.current.set(giftCard.id, el);
                  } else {
                    removeButtonRefs.current.delete(giftCard.id);
                  }
                }}
                giftCardId={giftCard.id}
                lastCharacters={giftCard.lastCharacters}
                onRemoveClick={() => handleRemoveClick(giftCard.id)}
              >
                <code className="font-heading text-xs font-extrabold text-[#a4e8aa]">
                  ***{giftCard.lastCharacters}
                </code>
                <span className="text-xs font-semibold text-white/80">
                  <Money as="span" data={giftCard.amountUsed} />
                </span>
              </RemoveGiftCardForm>
            </dd>
          ))}
        </dl>
      )}

      <AddGiftCardForm fetcherKey="gift-card-add">
        <div className="flex gap-2">
          <label className="sr-only" htmlFor={giftCardInputId}>
            Gift card code
          </label>
          <input
            className={FIELD}
            id={giftCardInputId}
            name="giftCardCode"
            placeholder="Gift card code"
            ref={giftCardCodeInput}
            type="text"
          />
          <button
            aria-label="Apply gift card code"
            className={APPLY_BUTTON}
            disabled={giftCardAddFetcher.state !== 'idle'}
            type="submit"
          >
            Apply
          </button>
        </div>
      </AddGiftCardForm>
    </section>
  );
}

function AddGiftCardForm({
  fetcherKey,
  children,
}: {
  fetcherKey?: string;
  children: React.ReactNode;
}) {
  return (
    <CartForm
      action={CartForm.ACTIONS.GiftCardCodesAdd}
      fetcherKey={fetcherKey}
      route="/cart"
    >
      {children}
    </CartForm>
  );
}

function RemoveGiftCardForm({
  giftCardId,
  lastCharacters,
  children,
  onRemoveClick,
  buttonRef,
}: {
  giftCardId: string;
  lastCharacters: string;
  children: React.ReactNode;
  onRemoveClick?: () => void;
  buttonRef?: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <CartForm
      action={CartForm.ACTIONS.GiftCardCodesRemove}
      inputs={{giftCardCodes: [giftCardId]}}
      route="/cart"
    >
      <span className="inline-flex items-center gap-2">
        {children}
        <button
          aria-label={`Remove gift card ending in ${lastCharacters}`}
          className={CHIP_REMOVE}
          onClick={onRemoveClick}
          ref={buttonRef}
          type="submit"
        >
          Remove
        </button>
      </span>
    </CartForm>
  );
}
```

- [ ] **Step 2: Delete the superseded rules from `app/styles/app.css`**

`.cart-summary-page`, `.cart-summary-aside`, `.cart-discount`, and `.cart-subtotal`. The entire `components/Cart` block should now be gone — delete its comment banner too.

- [ ] **Step 3: Verify**

```bash
npm run lint && npm run typecheck
```
Expected: both clean.

`npm run dev`, then look:
- Green footer welded to the bottom, fat top-left corner, list scrolling underneath it.
- **Checkout is a big orange pill** and is the loudest thing in the panel.
- Discount and gift-card fields are **hidden** behind "Have a discount or gift card?". Click it → they expand.
- Apply a real discount code → chip appears, disclosure stays open, close and reopen the drawer → still open. Remove works.
- Count the orange: line price + checkout button. Nothing else.

- [ ] **Step 4: Commit**

```bash
git add app/components/CartSummary.tsx app/styles/app.css
git commit -m "Rebuild the cart summary as a green footer with a real checkout button"
```

---

### Task 5: Live item count in the cart heading

**Files:**
- Modify: `app/components/PageLayout.tsx`

**Interfaces:**
- Consumes: `Aside`'s `heading: React.ReactNode` prop (Task 1 — already `ReactNode`, no signature change needed).
- Produces: nothing downstream.

The count needs the resolved cart, but the heading renders outside the body's `Await`. Resolve the same promise in its own `Suspense`/`Await` — React dedupes it, so this costs nothing.

- [ ] **Step 1: Modify `app/components/PageLayout.tsx`**

Add to the imports:

```tsx
import {useOptimisticCart} from '@shopify/hydrogen';
import {Await, useAsyncValue} from 'react-router';
```

(`Await` and `Suspense` are already imported; add `useAsyncValue` and `useOptimisticCart`.)

Replace `CartAside` and add `CartHeading` below it:

```tsx
function CartAside({cart}: {cart: PageLayoutProps['cart']}) {
  return (
    <Aside heading={<CartHeading cart={cart} />} type="cart">
      <Suspense fallback={<p className="px-5 text-sm text-[#5c7060]">Loading cart …</p>}>
        <Await resolve={cart}>
          {(cart) => <CartMain cart={cart} layout="aside" />}
        </Await>
      </Suspense>
    </Aside>
  );
}

function CartHeading({cart}: {cart: PageLayoutProps['cart']}) {
  return (
    <span className="block">
      Your cart
      <Suspense fallback={null}>
        {/* A rejected cart must not take the heading down — just show no count. */}
        <Await errorElement={<></>} resolve={cart}>
          <CartHeadingCount />
        </Await>
      </Suspense>
    </span>
  );
}

function CartHeadingCount() {
  const cart = useOptimisticCart(useAsyncValue() as CartApiQueryFragment | null);
  const count = cart?.totalQuantity ?? 0;

  if (count === 0) return null;

  return (
    <span className="mt-0.5 block font-sans text-xs font-bold text-[#4a6b4f]">
      {count} item{count === 1 ? '' : 's'}
    </span>
  );
}
```

- [ ] **Step 2: Verify**

```bash
npm run lint && npm run typecheck
```
Expected: both clean.

`npm run dev`, then look:
- Drawer header reads "Your cart" with the item count beneath it.
- Bump a quantity → **the count updates immediately**, before the server responds (that's `useOptimisticCart`).
- Empty the cart → the count line disappears, no stray "0 items".

- [ ] **Step 3: Commit**

```bash
git add app/components/PageLayout.tsx
git commit -m "Show a live item count in the cart drawer heading"
```

---

### Task 6: Full-drawer verification sweep

No code, unless this task finds bugs. This is the pass that catches what per-task checks miss.

**Files:** none expected.

- [ ] **Step 1: Confirm the CSS is actually gone**

```bash
grep -n "aside-width\|cart-aside-summary\|\.cart-main\|\.cart-line\|\.cart-summary\|\.cart-discount\|\.cart-subtotal\|\.overlay" app/styles/app.css
```
Expected: **no output.** Any hit is a rule that survived and may still be fighting the Tailwind classes.

```bash
grep -rn "sr-only" app/styles/app.css
```
Expected: `.sr-only` is still there. If it isn't, it was deleted by mistake in Task 1 — restore it, it is used across the app.

- [ ] **Step 2: Run the full checks**

```bash
npm run lint && npm run typecheck
```
Expected: both clean.

- [ ] **Step 3: Drive the drawer in `npm run dev`**

Work the list top to bottom and actually observe each one:

1. Empty cart → paw empty state; "Start shopping" closes the drawer and lands on `/collections`.
2. Add one item → mint card, no "Default Title", orange price.
3. Add enough items to overflow → middle scrolls; header and green footer both stay pinned; scrolling the list does not scroll the page behind it (`overscroll-contain`).
4. Stepper up and down; card dims mid-flight; − disabled at 1.
5. Remove the last line → empty state appears.
6. Discount code → chip, disclosure stays open across a close/reopen, remove works.
7. Checkout button navigates to Shopify checkout.
8. **Keyboard only:** Tab to the cart button, Enter to open, focus enters the panel, Tab cycles without escaping to the page behind, Escape closes, focus returns to the cart button.
9. **Narrow viewport:** drawer is full-width; footer clears the home indicator; **the mobile menu drawer still looks right** — it shares the shell.
10. **`/cart` page:** renders, is not broken, summary is the green card.
11. **Body scroll lock:** page behind cannot scroll while the drawer is open, and scrolls normally again after closing. Same for the mobile menu.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "Fix issues found in cart drawer verification"
```

---

## Self-Review

**Spec coverage** — every section maps to a task:

| Spec item | Task |
|---|---|
| Flex-column structure, kill magic-number scroll | 2 |
| Aside → Tailwind, delete `aside`/`.overlay` CSS | 1 |
| Focus into panel, restore to trigger, Tab trap | 1 |
| "Your cart" + live item count | 5 |
| Mint line cards, fat corner, `!` radius on image | 3 |
| Kill "Title: Default Title" | 3 |
| Stepper + Remove beside it | 3 |
| `isOptimistic` dimming | 3 |
| Nested bundle children | 3 |
| Green footer, fat corner, orange checkout pill | 4 |
| Codes disclosure, open when codes applied | 4 |
| Removable code chips, `placeholder:text-white/70` | 4 |
| Preserve gift-card focus-restore behavior | 4 |
| Empty state | 2 |
| Orange discipline (price + checkout only) | 3, 4 |
| Delete CSS vars + blocks, keep `.sr-only` | 1, 2, 3, 4, verified in 6 |
| Mobile menu regression check | 1, 6 |

**Deviation from spec, flagged:** the spec left `/cart` "inherits, undesigned". Task 4 renders the green summary block on **both** layouts rather than gating it to the drawer, because a drawer-only green block would require conditionally recolouring every element inside it (`text-[#bfe6c5]` is invisible on white). This is less conditional logic and leaves `/cart` looking intentional. Called out in Task 4.

**Placeholder scan:** no TBDs, no "add error handling", no "similar to Task N". Every code step carries its full code.

**Type consistency:** `CartLine` is exported from `CartLineItem.tsx` and imported by `CartMain.tsx` (unchanged from today). `CartLayout` and `LineItemChildrenMap` stay exported from `CartMain.tsx`. `CartLineItem({layout, line, childrenMap})` and `CartSummary({cart, layout})` keep their current signatures, so no call site outside these files changes except `PageLayout` in Task 5. `CartHeadingCount` uses `CartApiQueryFragment`, already imported in `PageLayout.tsx`.
