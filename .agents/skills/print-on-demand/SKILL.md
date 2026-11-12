---
name: print-on-demand
description: How Pawstie's print-on-demand personalization works end to end (custom.print_on_demand metafield, POD badge, nameplate form, cart line attributes). Use when changing ProductForm, ProductPodBadge, CartLineItem attributes, or adding a field to product cards.
---

# Print-on-demand personalization

Products flagged for personalization drive an extra checkout step. The flow:

1. The Storefront queries alias a metafield as `printOnDemand: metafield(namespace: "custom", key: "print_on_demand")` — present in `app/lib/fragments.ts`, `products.$handle.tsx`, and `collections.$handle.tsx`.
2. `isPrintOnDemand()` in `app/components/ProductPodBadge.tsx` reads it (string `'true'`), and `ProductPodBadge` renders the badge on cards and the PDP.
3. `ProductForm` gates add-to-cart behind a nameplate form and attaches cart line attributes: `Pet name`, `Phone number`, and `_pod`.
4. `CartLineItem` renders line attributes as "Personalization", **filtering out any key starting with `_`** — that underscore prefix is the convention for internal, non-displayed attributes.
