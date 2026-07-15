# Product Details Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the product details page with a multi-image gallery, policy-safe lower tabs, and a recommendation section that flows directly into the footer.

**Architecture:** Keep the existing Hydrogen product loader and cart/variant flow. Add a focused client-side gallery and tab component that receive already-loaded product data; remove policy-claiming UI from the hero. Move the description below the hero and keep recommendations as the final content section.

**Tech Stack:** Hydrogen, React Router 7, React, TypeScript, Tailwind CSS v4, Shopify Storefront GraphQL.

## Global Constraints

- Do not add new dependencies or Shopify mutations.
- Do not invent shipping, returns, care, guarantee, or review claims.
- Preserve cart, variant selection, breadcrumb, analytics, and recommendation behavior.
- Keep visible keyboard focus and responsive behavior at desktop and mobile widths.
- Generated GraphQL declaration files are build artifacts; update them only through codegen.

---

### Task 1: Add the product media gallery

**Files:**
- Create: `app/components/ProductGallery.tsx`
- Modify: `app/routes/products.$handle.tsx:1-105`
- Modify: `app/components/ProductImage.tsx:1-35` only if the shared image presentation needs a small prop adjustment

**Interfaces:**
- Consumes: `ProductFragment['images']['nodes']`, selected variant image, and product title.
- Produces: `<ProductGallery images selectedImage title />` with accessible thumbnail buttons and a stable primary image.

- [ ] **Step 1: Query all product images**

  Add `images(first: 12) { nodes { __typename id url altText width height } }` to the `Product` fragment in `app/routes/products.$handle.tsx`. Keep the existing `featuredImage` and variant image fields for compatibility.

- [ ] **Step 2: Implement gallery state and controls**

  Create `ProductGallery` with `useState` for the active image ID. Derive the initial active image from `selectedImage?.id`, falling back to the first product image. Render the large image with Hydrogen `Image`, then a horizontally scrollable row of `button` thumbnails. Each button must have `aria-label="View image N of M"`, `aria-pressed`, and the project focus ring.

- [ ] **Step 3: Wire the gallery into the hero**

  Replace the direct `ProductImage` call in `products.$handle.tsx` with `ProductGallery`. Pass `product.images.nodes`, `heroImage`, and `title`. Remove the unused `ProductImage` import if the component is no longer used by the route.

- [ ] **Step 4: Run type generation and typecheck**

  Run `npm run codegen && npm run typecheck`.

  Expected: codegen completes and TypeScript reports no errors.

- [ ] **Step 5: Commit the gallery change**

  ```bash
  git add app/components/ProductGallery.tsx app/routes/products.$handle.tsx app/components/ProductImage.tsx storefrontapi.generated.d.ts
  git commit -m "Add product image gallery"
  ```

### Task 2: Move description into lower tabs and remove policy claims

**Files:**
- Create: `app/components/ProductInfoTabs.tsx`
- Delete: `app/components/ProductPromises.tsx`
- Replace: `app/components/ProductDetails.tsx`
- Modify: `app/routes/products.$handle.tsx:10-100`

**Interfaces:**
- Consumes: `descriptionHtml`, product options, variant SKU, and product title.
- Produces: lower-page tabbed information panel with Description active by default and no policy/review claims.

- [ ] **Step 1: Extract safe additional-information fields**

  In `ProductInfoTabs`, build a small list from option names/values and the selected variant SKU. Render the Additional information tab only if that list is non-empty. Do not include shipping, returns, care, guarantee, or review copy.

- [ ] **Step 2: Implement accessible tabs**

  Use local `useState<'description' | 'additional'>('description')`. Each tab is a `button` with `role="tab"`, `aria-selected`, `aria-controls`, and a visible focus ring; the panel uses `role="tabpanel"` and matching IDs. Keep the screenshot’s pill-like active tab and pale page surface, but use the existing Pawstie type and colors.

- [ ] **Step 3: Preserve the existing description prose styling**

  Move the existing `PROSE` class into the new component. Render the Shopify `descriptionHtml` only in the Description panel, preserving heading, paragraph, list, and link styling.

- [ ] **Step 4: Place tabs below the hero**

  Remove `ProductPromises` and `ProductDetails` from the right purchase column. Render `<ProductInfoTabs ... />` after the hero grid and before `<RelatedProducts />`. Delete the old accordion component and import.

- [ ] **Step 5: Run lint and typecheck**

  Run `npm run lint && npm run typecheck`.

  Expected: both commands complete successfully with no lint or type errors.

- [ ] **Step 6: Commit the information tabs change**

  ```bash
  git add app/components/ProductInfoTabs.tsx app/components/ProductDetails.tsx app/components/ProductPromises.tsx app/routes/products.$handle.tsx
  git commit -m "Move product description into information tabs"
  ```

### Task 3: Remove the related-products white gap and verify the page

**Files:**
- Modify: `app/components/RelatedProducts.tsx:20-31`
- Modify: `app/routes/products.$handle.tsx:80-105` if spacing belongs at the route wrapper

**Interfaces:**
- Consumes: existing recommendation promise and product card rendering.
- Produces: a content-sized recommendation section with no artificial trailing whitespace before the footer.

- [ ] **Step 1: Make recommendation spacing content-driven**

  Keep the section background and responsive padding, but remove unnecessary full-width negative-margin behavior and excessive bottom padding if it creates the screenshot’s white tail. Keep only the margin needed between the info tabs and recommendations. Ensure the section has no fixed/minimum height.

- [ ] **Step 2: Run production validation**

  Run `npm run lint && npm run typecheck && npm run build`.

  Expected: all commands complete successfully.

- [ ] **Step 3: Inspect responsive output**

  Run the existing dev server and inspect a product route at desktop and mobile widths. Confirm: multiple images are selectable; the current image changes when a thumbnail is clicked; no policy claims remain; Description is below the hero; optional Additional information behaves correctly; and the related section meets the dark footer without a white gap.

- [ ] **Step 4: Commit the spacing fix**

  ```bash
  git add app/components/RelatedProducts.tsx app/routes/products.$handle.tsx
  git commit -m "Tighten product recommendations section"
  ```
