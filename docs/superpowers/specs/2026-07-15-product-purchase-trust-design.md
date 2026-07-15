# Product Purchase Trust Design

## Goal

Make the product purchase column feel more complete and trustworthy without adding visual clutter or making unsupported delivery and returns claims. Simplify the current add-to-cart treatment and explain how Shopify shipping rates are presented.

## Purchase action

Keep the existing quantity selector and cart submission behavior. Restyle the add-to-cart control as a simple, full-width orange pill with a small inline cart icon, centered label, restrained shadow, and subtle hover and pressed states. Remove the separated green icon block, asymmetric shape, deep three-dimensional base shadow, entrance animation, and cart-roll animation.

The disabled state remains visibly inactive, and the existing keyboard focus treatment and reduced-motion support remain intact.

## Trust panel

Add one compact pale-green assurance panel directly beneath the add-to-cart button. Give it a short branded heading, “The Pawstie Promise,” followed by three concise items:

1. Secure Shopify checkout.
2. Shipping rates shown at checkout, with a link to `/policies/shipping-policy`.
3. Easy returns, with a link to `/policies/refund-policy`.

Use small familiar icons and short supporting copy. The content must not state a delivery time, shipping price, free-shipping threshold, or return window because those values are not currently available in the product query.

## Shopify shipping behavior

Do not add a postcode estimator or attempt to show exact shipping methods on the product page. Shopify calculates eligible delivery options after the cart has buyer delivery information, so the product page will truthfully direct customers to checkout for rates and to the Shopify-managed shipping policy for details.

## Layout and responsiveness

Keep the assurance panel within the existing purchase action width. Display the trust items in a compact vertical list so labels and links stay readable at every breakpoint. Use the existing Pawstie green palette, pale-green surface, light border, and modest corner radius to fill the immediate empty area without wrapping the whole product summary in a heavy card.

## Components and data flow

Keep the implementation in `ProductForm` and the existing product purchase styles. The assurance panel is presentational and uses the storefront's stable policy routes, so it requires no new product query, loader data, cart mutation, or client state. The existing `AddToCartButton` continues to submit through Hydrogen's `CartForm` and open the cart aside.

## Accessibility and failure behavior

Trust icons are decorative and hidden from assistive technology; the text carries the meaning. Policy links use descriptive labels and visible focus states. If a Shopify policy has not been populated, the existing policy route handles that storefront state; the purchase action remains usable and no shipping promise is fabricated.

## Verification

- Run formatting or lint checks applicable to the edited files.
- Run `npm run typecheck`.
- Run `npm run build` to regenerate and validate Hydrogen GraphQL types.
- Visually inspect the product page at desktop and mobile widths.
- Confirm quantity changes, available and sold-out states, add-to-cart submission, cart-aside opening, keyboard focus, and both policy links.
