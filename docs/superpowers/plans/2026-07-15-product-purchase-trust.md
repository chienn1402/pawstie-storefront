# Product Purchase Trust Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the product add-to-cart control and add a compact, factual Shopify checkout, shipping, and returns assurance panel.

**Architecture:** Keep the feature presentational inside `ProductForm`; the existing Hydrogen `CartForm` remains the only cart integration. Stable storefront policy routes provide shipping and returns details, so no product query, loader, cart mutation, or state changes are needed.

**Tech Stack:** React 18, React Router 7, Shopify Hydrogen 2026.4.3, Tailwind CSS 4, project CSS, Lucide React.

## Global Constraints

- Preserve the existing quantity behavior, cart submission, cart-aside opening, option selection, and gallery work.
- Do not claim delivery times, shipping prices, free-shipping thresholds, or return windows.
- Exact shipping rates remain a Shopify checkout responsibility because buyer delivery information is unavailable on this product page.
- Keep keyboard focus, disabled-state, forced-colors, and reduced-motion behavior accessible.
- Do not add dependencies or a test runner.

---

### Task 1: Simplify the purchase action and add the assurance panel

**Files:**

- Modify: `app/components/ProductForm.tsx:1-64`
- Modify: `app/styles/app.css:8-171`

**Interfaces:**

- Consumes: `selectedVariant`, quantity state, `AddToCartButton`, `Link`, and the existing `open('cart')` callback.
- Produces: `.product-add-to-cart` simplified CTA markup and `.product-assurance` presentational policy content.

- [ ] **Step 1: Establish the pre-change verification baseline**

Run:

```bash
npm run typecheck
```

Expected: exit 0. This repository has no automated test runner, so typecheck plus browser interaction checks are the executable baseline.

- [ ] **Step 2: Add factual assurance markup and simplify the button markup**

Update the Lucide import and replace the purchase action content with:

```tsx
import {LockKeyhole, RotateCcw, ShoppingCart, Truck} from 'lucide-react';

<div className="product-purchase-actions">
  <div className="product-quantity-row">
    <span className="product-quantity-label">Quantity</span>
    <QuantitySelector
      value={quantity}
      onChange={setQuantity}
      disabled={!available}
    />
  </div>
  <AddToCartButton
    disabled={!available}
    onClick={() => open('cart')}
    lines={
      selectedVariant
        ? [{merchandiseId: selectedVariant.id, quantity, selectedVariant}]
        : []
    }
    className={`product-add-to-cart ${FOCUS_RING}`}
  >
    {available ? (
      <ShoppingCart aria-hidden="true" className="size-5" strokeWidth={2.25} />
    ) : null}
    <span>{available ? 'Add to cart' : 'Sold out'}</span>
  </AddToCartButton>

  <aside
    className="product-assurance"
    aria-labelledby="product-assurance-title"
  >
    <p id="product-assurance-title" className="product-assurance__title">
      The Pawstie Promise
    </p>
    <ul className="product-assurance__list">
      <li className="product-assurance__item">
        <LockKeyhole aria-hidden="true" className="product-assurance__icon" />
        <span>
          <strong>Secure Shopify checkout</strong>
          <small>Your payment details stay protected.</small>
        </span>
      </li>
      <li className="product-assurance__item">
        <Truck aria-hidden="true" className="product-assurance__icon" />
        <span>
          <strong>Shipping rates at checkout</strong>
          <small>
            <Link to="/policies/shipping-policy">View shipping policy</Link>
          </small>
        </span>
      </li>
      <li className="product-assurance__item">
        <RotateCcw aria-hidden="true" className="product-assurance__icon" />
        <span>
          <strong>Easy returns</strong>
          <small>
            <Link to="/policies/refund-policy">View refund policy</Link>
          </small>
        </span>
      </li>
    </ul>
  </aside>
</div>;
```

- [ ] **Step 3: Replace the decorative CTA CSS with restrained CTA and assurance styles**

Remove the two CTA keyframes, pseudo-element, icon-shell rules, icon animation, asymmetric radius, and deep base shadow. Style `.product-add-to-cart` as a centered flex row with `min-block-size: 3.75rem`, `border-radius: 999px`, orange background, one subtle shadow, and background/translate/shadow transitions. Add `.product-assurance`, title, list, item, icon, text, and policy-link rules using the existing green palette, pale-green surface, visible hover/focus states, and a forced-colors border fallback.

- [ ] **Step 4: Format and run static verification**

Run:

```bash
npx prettier --write app/components/ProductForm.tsx app/styles/app.css
npm run lint
npm run typecheck
npm run build
git diff --check
```

Expected: every command exits 0; generated types compile without manual edits; no whitespace errors are reported.

- [ ] **Step 5: Review the scoped diff**

Run:

```bash
git diff -- app/components/ProductForm.tsx app/styles/app.css
```

Expected: the diff preserves existing option selection, quantity state, `CartForm` inputs, cart-aside callback, and product gallery changes; only the purchase CTA markup/styles and assurance content change.

### Task 2: Verify the storefront interaction and responsive presentation

**Files:**

- Verify: `app/components/ProductForm.tsx`
- Verify: `app/styles/app.css`

**Interfaces:**

- Consumes: the local Hydrogen storefront and an existing product route.
- Produces: visual and behavioral confirmation for desktop, mobile, keyboard, available, and sold-out states.

- [ ] **Step 1: Start the local storefront**

Run:

```bash
npm run dev
```

Expected: Hydrogen reports a local storefront URL and finishes code generation without errors.

- [ ] **Step 2: Verify desktop and mobile layout in a real browser**

At an existing product URL, inspect approximately 1440px and 390px viewport widths. Confirm the CTA is a simple orange pill; the assurance panel sits directly beneath it; all three items remain readable; and the product column has no horizontal overflow.

- [ ] **Step 3: Verify behavior and accessibility**

Confirm quantity decrement/increment still works; add to cart opens the cart aside and adds the selected quantity; sold-out variants disable the CTA; Tab reaches the CTA and both policy links with visible focus; both policy links resolve; and icons do not add redundant accessible names.

- [ ] **Step 4: Commit the implementation**

```bash
git add app/components/ProductForm.tsx app/styles/app.css docs/superpowers/plans/2026-07-15-product-purchase-trust.md
git commit -m "Refine product purchase trust panel"
```

Expected: the commit includes the approved purchase-action implementation and its plan, but does not include unrelated uncommitted files.
