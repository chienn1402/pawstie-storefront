# Product Gallery Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render and play Shopify-hosted and external product videos in the existing product gallery while preserving image and variant-selection behavior.

**Architecture:** Fetch Shopify's ordered `media` connection, then make `ProductGallery` operate on its generated union instead of image nodes. Hydrogen's `MediaFile` chooses the native image, video, iframe, or model renderer; the gallery owns selection, previews, fallbacks, and presentation.

**Tech Stack:** Shopify Hydrogen 2026.4.3, Storefront GraphQL API, React 18, React Router 7, TypeScript 5.9, Tailwind CSS 4, Node.js 22 native test runner.

## Global Constraints

- Import routing APIs from `react-router`, never Remix or `react-router-dom`.
- Use Hydrogen's `MediaFile`; add no player dependency or custom playback state.
- Preserve the current 4:5 geometry, thumbnail grid, visual styling, and variant-image synchronization.
- Hosted video uses native controls, inline playback, Shopify's preview poster, and `preload="none"`.
- External video stays provider-aware through Hydrogen's `ExternalVideo` path.
- Do not add autoplay, custom controls, unsupplied captions, zoom, lightbox behavior, or a carousel rewrite.
- Add no test dependency; use Node's native test runner for focused source-contract regression checks.

## File Structure

- Create `scripts/product-gallery-media.test.mjs`: query and gallery source-contract checks.
- Modify `app/routes/products.$handle.tsx`: query and pass ordered product media.
- Modify `app/components/ProductGallery.tsx`: render and select product-media union members.
- Modify `app/components/icons.tsx`: add the play glyph used on video previews.
- Regenerate `storefrontapi.generated.d.ts`: generated `ProductFragment.media` types; never edit it manually.

---

### Task 1: Fetch the Product-Media Contract

**Files:**
- Create: `scripts/product-gallery-media.test.mjs`
- Modify: `app/routes/products.$handle.tsx`
- Regenerate: `storefrontapi.generated.d.ts`

**Interfaces:**
- Consumes: Storefront API `Product.media` and the existing `Product` fragment.
- Produces: `ProductFragment['media']['nodes']` with common identity/preview fields and concrete renderer fields.

- [ ] **Step 1: Write the failing query-contract check**

Create `scripts/product-gallery-media.test.mjs`:

```js
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const productRoute = await readFile(
  new URL('../app/routes/products.$handle.tsx', import.meta.url),
  'utf8',
);

test('the product query requests every Hydrogen product-media shape', () => {
  const requiredGraphql = [
    'media(first: 12)',
    'mediaContentType',
    'previewImage { id url altText width height }',
    '... on MediaImage',
    '... on Video',
    'sources { url mimeType }',
    '... on ExternalVideo',
    'embedUrl',
    '... on Model3d',
  ];

  for (const field of requiredGraphql) {
    assert.ok(productRoute.includes(field), `missing GraphQL media field: ${field}`);
  }
});
```

- [ ] **Step 2: Verify RED**

Run `node --test scripts/product-gallery-media.test.mjs`.

Expected: FAIL with `missing GraphQL media field: media(first: 12)`.

- [ ] **Step 3: Add the complete media connection**

Keep `images(first: 12)` temporarily so the current gallery typechecks, and add this directly after it in `PRODUCT_FRAGMENT`:

```graphql
media(first: 12) {
  nodes {
    __typename
    id
    alt
    mediaContentType
    previewImage { id url altText width height }
    ... on MediaImage {
      image { __typename id url altText width height }
    }
    ... on Video {
      sources { url mimeType }
    }
    ... on ExternalVideo {
      embedUrl
      host
    }
    ... on Model3d {
      sources { url mimeType }
    }
  }
}
```

- [ ] **Step 4: Regenerate types and verify GREEN**

```bash
npm run codegen
node --test scripts/product-gallery-media.test.mjs
npm run typecheck
```

Expected: codegen exits 0, `1` test passes, and typecheck exits 0.

- [ ] **Step 5: Commit**

```bash
git add scripts/product-gallery-media.test.mjs app/routes/products.\$handle.tsx storefrontapi.generated.d.ts
git commit -m "Fetch product media for the gallery"
```

---

### Task 2: Render and Select Every Supported Media Type

**Files:**
- Modify: `scripts/product-gallery-media.test.mjs`
- Modify: `app/routes/products.$handle.tsx`
- Modify: `app/components/ProductGallery.tsx`
- Modify: `app/components/icons.tsx`
- Regenerate: `storefrontapi.generated.d.ts`

**Interfaces:**
- Consumes: `ProductFragment['media']['nodes']`, `ProductVariantFragment['image']`, and Hydrogen `MediaFile`.
- Produces: `ProductGallery({media, selectedImage, title})` with media selection, rendering, previews, labels, and fallbacks.

- [ ] **Step 1: Extend the regression check**

Append to `scripts/product-gallery-media.test.mjs`:

```js
const productGallery = await readFile(
  new URL('../app/components/ProductGallery.tsx', import.meta.url),
  'utf8',
);

test('the product route passes ordered media to the gallery', () => {
  assert.ok(productRoute.includes('media={product.media.nodes}'));
  assert.equal(productRoute.includes('images={product.images.nodes}'), false);
  assert.equal(productRoute.includes('images(first: 12)'), false);
});

test('the gallery uses Hydrogen media rendering and defers video loading', () => {
  assert.match(productGallery, /import \{Image, MediaFile\} from '@shopify\/hydrogen'/);
  assert.ok(productGallery.includes("media: ProductFragment['media']['nodes']"));
  assert.ok(productGallery.includes('<MediaFile'));
  assert.ok(productGallery.includes("preload: 'none'"));
  assert.ok(productGallery.includes('playsInline: true'));
  assert.ok(productGallery.includes('Product media'));
  assert.ok(productGallery.includes('<PlayIcon'));
});
```

- [ ] **Step 2: Verify RED**

Run `node --test scripts/product-gallery-media.test.mjs`.

Expected: the query test passes and both new gallery tests fail because the route still passes `images` and the component imports only `Image`.

- [ ] **Step 3: Add the play icon**

Add after `PawIcon` in `app/components/icons.tsx`:

```tsx
export function PlayIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M8.2 5.4a1 1 0 0 1 1.52-.85l9.05 6.1a1.62 1.62 0 0 1 0 2.7l-9.05 6.1a1 1 0 0 1-1.52-.85V5.4Z" />
    </svg>
  );
}
```

- [ ] **Step 4: Replace the image-only gallery**

Replace `app/components/ProductGallery.tsx` with the following complete component:

```tsx
import {useEffect, useState} from 'react';
import {Image, MediaFile} from '@shopify/hydrogen';
import type {
  ProductFragment,
  ProductVariantFragment,
} from 'storefrontapi.generated';
import {PawIcon, PlayIcon} from '~/components/icons';

type ProductMedia = ProductFragment['media']['nodes'][number];

function getPreviewImage(media: ProductMedia) {
  if (media.previewImage) return media.previewImage;
  return media.__typename === 'MediaImage' ? media.image : null;
}

function getMediaKind(media: ProductMedia) {
  if (media.__typename === 'Video' || media.__typename === 'ExternalVideo') {
    return 'video';
  }
  if (media.__typename === 'Model3d') return '3D model';
  return 'image';
}

function isRenderableMedia(media: ProductMedia) {
  switch (media.__typename) {
    case 'MediaImage':
      return Boolean(media.image?.url);
    case 'Video':
      return media.sources.some((source) => source.url && source.mimeType);
    case 'ExternalVideo':
      return Boolean(media.embedUrl);
    case 'Model3d':
      return media.sources.some((source) => source.url);
    default:
      return false;
  }
}

function MediaFallback() {
  return (
    <div className="grid aspect-[4/5] w-full place-items-center text-[#00521d]/40">
      <PawIcon className="size-16" />
    </div>
  );
}

export function ProductGallery({
  media,
  selectedImage,
  title,
}: {
  media: ProductFragment['media']['nodes'];
  selectedImage?: ProductVariantFragment['image'];
  title: string;
}) {
  const displayableMedia = media.filter(isRenderableMedia);
  const selectedImageId = selectedImage?.id ?? null;
  const selectedMediaId =
    displayableMedia.find(
      (item) =>
        item.__typename === 'MediaImage' && item.image?.id === selectedImageId,
    )?.id ?? null;
  const fallbackMediaId = displayableMedia[0]?.id ?? null;
  const [activeMediaId, setActiveMediaId] = useState<string | null>(
    () => selectedMediaId ?? fallbackMediaId,
  );

  useEffect(() => {
    setActiveMediaId(selectedMediaId ?? fallbackMediaId);
  }, [fallbackMediaId, selectedMediaId]);

  const activeMedia =
    displayableMedia.find((item) => item.id === activeMediaId) ??
    displayableMedia[0];
  const activeIndex = activeMedia
    ? displayableMedia.findIndex((item) => item.id === activeMedia.id)
    : -1;
  const activeKind = activeMedia ? getMediaKind(activeMedia) : null;

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="relative overflow-hidden rounded-[2rem] rounded-br-[4.75rem] bg-[#f1efe8] shadow-[0_18px_45px_rgba(0,72,23,0.08)]">
        {activeMedia ? (
          <MediaFile
            aria-label={activeMedia.alt || `${title} ${activeKind}`}
            className="aspect-[4/5] w-full rounded-none! object-cover"
            data={activeMedia}
            key={activeMedia.id}
            mediaOptions={{
              image: {
                alt: activeMedia.alt || title || 'Product image',
                aspectRatio: '4/5',
                loading: 'eager',
                sizes: '(min-width: 64em) 45vw, 100vw',
              },
              video: {
                className: 'aspect-[4/5] w-full bg-black object-contain',
                controls: true,
                playsInline: true,
                preload: 'none',
              },
            }}
          />
        ) : (
          <MediaFallback />
        )}

        {activeMedia ? (
          <span
            className={`pointer-events-none absolute left-4 rounded-full bg-white/85 px-3 py-1 font-heading text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#347345] shadow-sm backdrop-blur-sm ${activeKind === 'image' ? 'bottom-4' : 'top-4'}`}
          >
            {activeIndex + 1} / {displayableMedia.length}
          </span>
        ) : null}
      </div>

      {displayableMedia.length > 0 ? (
        <div
          className="grid grid-cols-4 gap-2.5 sm:grid-cols-5 sm:gap-3 lg:grid-cols-6"
          aria-label="Product media"
        >
          {displayableMedia.map((item, index) => {
            const isActive = item.id === activeMediaId;
            const kind = getMediaKind(item);
            const previewImage = getPreviewImage(item);

            return (
              <button
                type="button"
                key={item.id}
                aria-label={`View ${kind} ${index + 1} of ${displayableMedia.length}`}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => setActiveMediaId(item.id)}
                className={`group relative aspect-[4/5] min-w-0 overflow-hidden rounded-2xl bg-[#f1efe8] p-0.5 transition-[box-shadow,opacity,transform] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00521d] motion-reduce:transition-none ${isActive ? 'shadow-[0_0_0_2px_#00521d,0_0_0_4px_#fff]' : 'opacity-70 hover:-translate-y-0.5 hover:opacity-100 hover:shadow-[0_8px_18px_rgba(0,72,23,0.12)]'}`}
              >
                {previewImage ? (
                  <Image
                    alt=""
                    aspectRatio="4/5"
                    data={previewImage}
                    loading="lazy"
                    sizes="6rem"
                    className="size-full rounded-[0.9rem]! object-cover"
                  />
                ) : (
                  <div className="grid size-full place-items-center text-[#00521d]/35">
                    <PawIcon className="size-8" />
                  </div>
                )}

                {kind === 'video' ? (
                  <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
                    <span className="grid size-9 place-items-center rounded-full bg-white/90 text-[#00521d] shadow-md">
                      <PlayIcon className="ml-0.5 size-4" />
                    </span>
                  </span>
                ) : null}

                <span
                  aria-hidden="true"
                  className={`absolute inset-0 rounded-[0.9rem] border transition-colors motion-reduce:transition-none ${isActive ? 'border-[#00521d]/20' : 'border-white/50 group-hover:border-white'}`}
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 5: Pass media and remove the obsolete images field**

Replace the route's gallery call with:

```tsx
<ProductGallery
  key={product.id}
  media={product.media.nodes}
  selectedImage={heroImage}
  title={title}
/>
```

Remove `images(first: 12) { nodes { __typename id url altText width height } }` from `PRODUCT_FRAGMENT`.

- [ ] **Step 6: Regenerate types and verify GREEN**

```bash
npm run codegen
node --test scripts/product-gallery-media.test.mjs
npm run typecheck
npm run lint
```

Expected: codegen exits 0, `3` tests pass, typecheck exits 0, and ESLint reports no errors.

- [ ] **Step 7: Commit**

```bash
git add scripts/product-gallery-media.test.mjs app/routes/products.\$handle.tsx app/components/ProductGallery.tsx app/components/icons.tsx storefrontapi.generated.d.ts
git commit -m "Render video in the product gallery"
```

---

### Task 3: Validate Production Output and Shopper Interactions

**Files:**
- Verify: `app/routes/products.$handle.tsx`
- Verify: `app/components/ProductGallery.tsx`
- Verify: `storefrontapi.generated.d.ts`

**Interfaces:**
- Consumes: the completed query and gallery.
- Produces: build, static-analysis, Hydrogen-validation, and browser evidence that the original failure is resolved without image or variant regressions.

- [ ] **Step 1: Run full non-browser verification**

```bash
node --test scripts/product-gallery-media.test.mjs
npm run typecheck
npm run lint
npm run build
git diff --check
```

Expected: `3` tests pass; typecheck, lint, and build exit 0; `git diff --check` prints no errors.

- [ ] **Step 2: Validate Hydrogen component usage**

```bash
node /Users/mike/.codex/plugins/cache/openai-curated-remote/shopify/2.0.0/skills/shopify-hydrogen/scripts/validate.mjs --code "$(sed -n '1,260p' app/components/ProductGallery.tsx)" --model gpt-5 --client-name codex --client-version 1 --artifact-id pawstie-product-gallery-media --revision 1
```

Expected: validation succeeds. If it names an invalid Hydrogen prop or type, search that name with `search_docs.mjs`, change only that usage, increment `--revision`, and retry no more than three total revisions.

- [ ] **Step 3: Start the storefront**

Run `npm run dev`, open the printed local URL, and navigate to a product with both an image and video in Shopify product media.

- [ ] **Step 4: Verify desktop behavior at 1440px**

Confirm:

1. The initial image appears without layout shift.
2. Video previews show the play badge.
3. Selecting a hosted video shows its poster and native controls.
4. Play starts playback and pause, seek, volume, and fullscreen controls work.
5. Selecting an external video loads its provider embed with an accessible name.
6. Selecting an image unmounts and stops the previous video.
7. Selecting a variant activates its matching media image.
8. The counter matches the selected item's ordered-media position.

- [ ] **Step 5: Verify responsive and keyboard behavior**

At 390px width, confirm the 4:5 hero space is stable, video controls are not clipped, and previews remain usable. With Tab, Shift+Tab, Enter, and Space, confirm every preview has a visible focus outline, selects its media, and native controls are reachable.

- [ ] **Step 6: Inspect repository state**

```bash
git status --short
git log -3 --oneline
git diff HEAD~2..HEAD --check
```

Expected: no uncommitted implementation files, both implementation commits follow the design/plan commits, and their diff has no whitespace errors.
