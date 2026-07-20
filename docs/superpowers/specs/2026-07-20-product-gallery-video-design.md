# Product Gallery Video Support

## Goal

Allow the product gallery to display and play every media type supplied by Shopify while preserving the current gallery layout and variant-image synchronization.

## Root Cause

The product query requests only `product.images`, and `ProductGallery` accepts only image nodes. Shopify-hosted videos and external videos therefore never reach the component and cannot appear in the gallery.

## Data Model

Replace the image-only gallery input with the product's ordered `media` connection. The Storefront API fragment will request the fields Hydrogen's `MediaFile` component needs for:

- `MediaImage`
- Shopify-hosted `Video`
- `ExternalVideo` providers such as YouTube and Vimeo
- `Model3d`, so the gallery follows Shopify's complete product-media contract

Each media item will include its stable ID, type, alternative text, and preview image. Type-specific sources or embed URLs will be requested only for the relevant media type.

The selected variant image remains an image object rather than a media node. The product route will match that image ID to a `MediaImage` in the media connection before passing the selected media ID to the gallery. If Shopify does not return a matching media item, the gallery falls back to the first product media item.

## Gallery Behavior

`ProductGallery` will track an active media ID instead of an active image ID. The active item will be rendered with Hydrogen's `MediaFile`, which chooses the appropriate native renderer from the media `__typename`.

- Images retain the current responsive sizing, crop, rounded container, and above-the-fold loading behavior.
- Shopify-hosted videos use native controls, inline playback, the Shopify preview image as a poster, and deferred preload so they do not compete with the initial product image.
- External videos use Hydrogen's provider-aware embed renderer with a descriptive title.
- 3D media uses Hydrogen's model viewer defaults.

Changing a product option continues to select the corresponding variant image. Selecting a thumbnail updates only the gallery's local active-media state.

## Thumbnails and Accessibility

The thumbnail strip remains visually unchanged and uses each media item's preview image. Video thumbnails receive a visible play indicator. Buttons use media-aware accessible labels such as “View video 2 of 4,” and the strip label and counter use “product media” semantics rather than “product images.” Native video controls remain keyboard accessible.

If an item has no usable preview image, its thumbnail displays the existing paw placeholder plus a text-independent icon treatment rather than failing to render.

## Error and Fallback Handling

- An empty media connection renders the existing paw placeholder.
- An unsupported or incomplete media node renders the placeholder instead of crashing the product page.
- A selected variant image that is absent from the media connection falls back to the first media item.
- Media sources are provided directly by Shopify; the gallery will not introduce custom playback state, autoplay, or third-party player dependencies.

## Testing and Verification

Because this repository has no configured test runner, add a focused executable regression check that validates the product fragment and gallery source contain the required media contract and rendering path. Run it before implementation to confirm it fails for the current image-only code, then after implementation to confirm it passes.

After the focused regression check passes:

1. Regenerate Storefront API and route types.
2. Run TypeScript typechecking.
3. Run ESLint.
4. Build the production storefront.
5. Verify in a browser that image, hosted-video, and external-video thumbnails select the correct media; hosted video plays with native controls; variant selection still activates its image; and the layout remains stable at desktop and mobile widths.

## Scope Boundaries

This change does not add autoplay, custom video controls, captions that are not supplied by Shopify, zoom/lightbox behavior, or a carousel rewrite. It does not alter product administration or media uploaded in Shopify.
