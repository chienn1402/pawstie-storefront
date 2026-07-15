# Product details page redesign

## Goal

Make the product details page feel complete and trustworthy without inventing or duplicating store policies, while matching the supplied reference layouts.

## Design

- Replace the single product image with a responsive gallery using the product's image connection. The selected variant image remains the primary image when available; shoppers can select any product image with accessible thumbnail buttons.
- Keep the existing Pawstie visual language: dark green headings, leafy green body text, orange purchase action, soft green surfaces, rounded image treatment, and current typography.
- Remove the current promises block and the Shipping & returns / Care & cleaning accordions. They currently make policy claims that are not guaranteed by the storefront configuration.
- Move product description content below the hero purchase area into a full-width tab panel. Description is active by default. Additional information is shown only when there is useful product option/SKU data. Reviews are not shown without a real reviews source.
- Keep recommendations below the description and let the section height be content-driven so it flows directly into the footer without an empty white tail.

## Responsive behavior

- Desktop: two-column hero with gallery on the left and purchase panel on the right; tabs span the shared content width below it.
- Mobile: gallery stacks above purchase panel; thumbnails remain horizontally scrollable; tabs remain horizontally usable without wrapping awkwardly.
- All interactive gallery and tab controls have visible keyboard focus and usable labels.

## Data and boundaries

- Extend the product query only with product media needed for the gallery.
- Do not add new policy text, review data, external dependencies, or Shopify mutations.
- Preserve existing cart, variant selection, analytics, breadcrumb, and recommendation behavior.

## Verification

- Run `npm run typecheck` and `npm run lint`.
- Run the production build if the local environment supports the existing Shopify credentials.
- Inspect the product page at desktop and mobile widths to verify gallery selection, tabs, no policy claims, and no white gap before the footer.
