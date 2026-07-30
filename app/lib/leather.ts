import type {RecommendedProductFragment} from 'storefrontapi.generated';

/**
 * Config for the `/lp/leather` paid-social landing page.
 *
 * The store has no real leather collection to query, so the page resolves its
 * products through Storefront product search the same way `/shop` resolves its
 * category chips (see `app/lib/shop.ts`). Search relevance is not a stable
 * order to run a campaign against, though — an ad that has been approved and is
 * spending should not silently reshuffle its landing page — so the results get
 * re-sorted here against a curated handle order.
 */
export const LEATHER_SEARCH_QUERY = 'leather';

/** The product the hero and the spotlight section are built around. */
export const LEATHER_HERO_HANDLE =
  'the-signature-genuine-leather-airtag-collar';

/** The engravable collar, used by the personalization section. */
export const LEATHER_NAMEPLATE_HANDLE = 'the-heritage-nameplate-leather-collar';

/**
 * Curated running order. Handles missing from this list still render — they
 * sort after everything named here, so a newly added leather product appears on
 * the page without a code change instead of disappearing from it.
 */
const CURATED_HANDLE_ORDER: readonly string[] = [
  LEATHER_HERO_HANDLE,
  LEATHER_NAMEPLATE_HANDLE,
  'the-artisan-braided-leather-dog-collar',
  'the-heritage-genuine-leather-leash-1',
  'the-heritage-reflective-leather-harness',
];

function curatedIndex(handle: string) {
  const index = CURATED_HANDLE_ORDER.indexOf(handle);
  return index === -1 ? CURATED_HANDLE_ORDER.length : index;
}

/**
 * The helpers below are generic over the fragment rather than typed to it flat,
 * so a caller that queries extra fields alongside `...RecommendedProduct` (the
 * landing page asks for a second image) gets those fields back on the far side
 * instead of having them widened away.
 */
function isBuyable(product: RecommendedProductFragment) {
  return product.selectedOrFirstAvailableVariant?.availableForSale ?? false;
}

/**
 * Storefront search matches description text as well as titles, so a product
 * that merely *mentions* leather can come back. Cold ad traffic lands here
 * expecting one material and nothing else, so the page holds itself to titles.
 */
function isLeather(product: RecommendedProductFragment) {
  return product.title.toLowerCase().includes('leather');
}

/**
 * Sold-out products sink to the end rather than being dropped: the range still
 * reads as a range, and `ProductCard` already renders a "Sold out" state. What
 * they must not do is take a paid click above the fold.
 */
export function orderLeatherProducts<T extends RecommendedProductFragment>(
  products: readonly T[],
): T[] {
  return products.filter(isLeather).sort((a, b) => {
    const availability = Number(isBuyable(b)) - Number(isBuyable(a));
    if (availability !== 0) return availability;

    const curated = curatedIndex(a.handle) - curatedIndex(b.handle);
    if (curated !== 0) return curated;

    return a.title.localeCompare(b.title);
  });
}

/**
 * The lowest price in the range, for the hero's "from" anchor. Returns null on
 * an empty range so the hero drops the line instead of rendering "from $0".
 */
export function lowestPrice(products: readonly RecommendedProductFragment[]) {
  return products.reduce<RecommendedProductFragment['priceRange']['minVariantPrice'] | null>(
    (lowest, product) => {
      const price = product.priceRange.minVariantPrice;
      if (!lowest) return price;
      return Number(price.amount) < Number(lowest.amount) ? price : lowest;
    },
    null,
  );
}
