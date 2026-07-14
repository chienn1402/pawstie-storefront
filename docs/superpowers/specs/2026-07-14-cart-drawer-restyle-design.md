# Cart Drawer Restyle — Design

**Date:** 2026-07-14
**Branch:** `feat/landing-page`
**Status:** Approved, ready for planning

## Problem

The cart drawer is untouched Hydrogen skeleton markup. It looks like a different website from the one behind it, and it has structural problems beyond styling:

- Checkout is a **text link**, not a button — the most important action in the panel has the least visual weight.
- `Title: Default Title` renders on every single-variant product.
- Quantity reads as prose: `Quantity: 1  − + Remove`, glued together with `&nbsp;`.
- Discount and gift-card inputs are always expanded, eating a third of the panel and competing with checkout.
- The scroll is faked with magic numbers (`--cart-aside-summary-height: 250px`, plus a second number for the discount case) instead of a flex column with a scrolling middle.
- The empty state is a `<br>`, a sentence, and a link.
- The shell has no focus management: focus never enters the panel, never returns to the trigger, and Tab is not trapped.

## Scope

**In:** the cart drawer (aside layout) and the shared `Aside` shell.

**Out:**

- The `/cart` page. It shares `CartMain`/`CartLineItem`/`CartSummary`, so it inherits the component changes and will look different — but its `page` layout is **not** being designed here. Separate pass.
- Free-shipping progress bar and upsell rows (merchandising direction was declined).
- Migrating `Aside` to a native `<dialog>` + popover. Bigger refactor than this warrants; the current transform-based mechanism stays.

## Visual direction

Brand-native. Reuses the language already established in `ProductCard` and `CartFab`: deep green `#00521d`, mint `#a4e8aa`, orange `primary`, Figtree headings, and the asymmetric fat corner.

Validated interactively against three compositions; the chosen result is a hybrid — **mint line-item cards** + **deep-green footer block**, with "Remove" beside the stepper rather than right-aligned (right-aligned put it in the fat corner, where the text and the curve competed).

**Orange discipline:** orange appears exactly twice in the drawer — the line price and the checkout button. Everything else is green/mint. This is what keeps checkout the loudest element in the panel.

**Three-surface stack** (mint card → white panel → green footer) was reviewed and approved as-is. If it ever reads busy, the fix is warming the panel to `#fbfdfb`, not changing the cards.

## Structure

The drawer becomes a three-part flex column:

```
┌─────────────────────────┐
│ header   (pinned)       │  "Your cart" + live item count, circular × 
├─────────────────────────┤
│ list     (flex-1,       │  mint cards, scrolls independently,
│           overflow-y,   │  overscroll-contain
│           min-h-0)      │
│                    ╭────┤
├────────────────────╯    │  ← fat corner bites into the list
│ footer   (pinned)       │  green block: subtotal, checkout pill, codes
└─────────────────────────┘
```

This replaces `.cart-main { max-height: calc(100vh - var(--cart-aside-summary-height)) }` and its `.with-discount` twin. Both rules and both CSS variables are deleted.

## Components

### `Aside.tsx` — the shell

Shared with the mobile menu drawer. Moves to Tailwind; the `aside { … }` and `.overlay { … }` rules at `app.css:87-201` are deleted.

- Panel: full-width on mobile, `28rem` from `sm:` up. Softly rounded left edge. White.
- Panel is `flex flex-col`; `<main>` is `flex-1 min-h-0 flex flex-col` so children can own their own scrolling.
- Header: heading node + circular ghost close button.
- Keeps the existing transform/overlay open-close mechanism and the Escape handler.

**New behavior — focus management** (absent today):

- On open, focus moves into the panel.
- On close, focus returns to the element that opened it.
- Tab is trapped within the panel while open.

`heading` is already typed `React.ReactNode`, so the cart can pass a live count without changing the signature.

### `PageLayout.tsx`

`CartAside` passes a heading node that resolves the cart promise in its own `Suspense`/`Await` to render "Your cart" + item count. Falls back to "Your cart" while pending. Same promise as the body — React dedupes it.

### `CartMain.tsx`

- Early-returns the empty state when there are no lines, instead of rendering a `hidden` div alongside the real cart.
- Wraps the line list in the scrolling middle section.
- `CartEmpty` currently accepts a `layout` prop it never uses — remove it.

**Empty state:** paw glyph (`PawIcon`, already in `icons.tsx`) in a mint circle, "Your cart is empty", a supporting line, and a "Start shopping" pill linking to `/collections` and closing the drawer. Orange is free here — there is no checkout button to compete with.

### `CartLineItem.tsx`

- Mint `#eaf7ea` card, `rounded-[1.25rem] rounded-br-[2.5rem]`.
- Image tile `#a4e8aa`, ~62px. **Radius needs `!`** — `img { border-radius: 4px }` at `app.css:11` is unlayered, so it beats Tailwind's layered utilities. `ProductCard` already uses `rounded-none!` for the same reason.
- Title `#004817`, price orange.
- Variant options render **only when real**: filter out `{name: 'Title', value: 'Default Title'}`, which Shopify emits for every single-variant product.
- Bottom row: stepper pill (`− n +`, segmented, white on mint) with "Remove" beside it.
- `isOptimistic` lines dim and go inert.
- Nested bundle children (`cart-line-children`) render as inset sub-rows inside the parent card.

### `CartSummary.tsx`

- Green `#00521d` block, `rounded-tl-[2.25rem]`, white text.
- Subtotal row + quiet "Shipping & taxes calculated at checkout".
- Checkout: full-width orange pill. Stays an `<a href={checkoutUrl}>` — it is a link, not a form submit.
- Discount and gift-card forms collapse behind a **"Have a discount or gift card?"** disclosure, open by default when a code or gift card is already applied.
- Applied codes/gift cards render as removable chips.
- Inputs on green: translucent white fill, `placeholder:text-white/70` (not `/50` — contrast).
- The existing gift-card focus-restore logic in `CartSummary` is behavior, not styling. Preserve it.

### `app.css`

Delete, precisely — the ranges are **not** contiguous:

- `app.css:87-142` — the `aside` element rules.
- `app.css:156-201` — the `.overlay` rules.
- `app.css:402-460` — the `components/Cart` block.
- `app.css:2-4` — all three variables (`--aside-width`, `--cart-aside-summary-height`, `--cart-aside-summary-height-with-discount`). Verified by grep: their only consumers are the blocks above, so nothing else breaks.

**Do not delete `.sr-only` (`app.css:144-154`).** It sits between the two aside ranges and is used across the app. Same for `button.reset` (`app.css:203`), which sits just past them.

Leave `img { border-radius: 4px }` alone — global, out of scope, worked around with `!`.

## Constraints

- Do **not** touch `app/styles/tailwind.css`. The user owns the theme. Greens are arbitrary values; orange is the `primary` token.
- React Router imports only — never `@remix-run/*`, never `react-router-dom`.
- Mobile: panel is full-width; footer respects `env(safe-area-inset-bottom)`.
- No test runner exists in this repo. Verification is visual, in the running dev server.

## Risks

**Deleting the shared `aside` rules restyles the mobile menu drawer too.** That is intentional — one drawer system — but the mobile menu must be visually checked before merge, on a narrow viewport.

## Verification

No test runner. Drive the real app:

1. Add a line → drawer opens, card renders, no "Default Title".
2. Stepper up/down; line dims mid-flight; Remove empties the list → empty state appears.
3. Apply a discount code → disclosure is open on reopen, chip renders, remove works.
4. Overflow the list with enough lines → middle scrolls, header and footer stay pinned.
5. Keyboard: open → focus enters panel; Tab cycles inside; Escape closes; focus returns to the cart button.
6. Narrow viewport: drawer is full-width, **and the mobile menu still looks right**.
7. `npm run lint && npm run typecheck`.
