import type {ProductFragment} from 'storefrontapi.generated';

/**
 * Product schema.org markup for Google merchant listings.
 *
 * Describes `selectedOrFirstAvailableVariant` rather than the client-side
 * optimistic variant: meta renders on the server, and the canonical strips the
 * ?Option= params, so the indexed URL and this markup describe the same variant.
 *
 * No aggregateRating: the storefront has no review source, and Google issues
 * manual actions for ratings that aren't backed by real ones. No
 * priceValidUntil either — Google reads a past date as an expired offer, and
 * the Storefront API has no field to derive an honest one from.
 *
 * Returns null rather than a partial object when there's nothing sellable to
 * describe; Search Console reports an incomplete Product as a page error.
 */
export function productJsonLd({
  product,
  origin,
}: {
  product: ProductFragment;
  origin?: string;
}) {
  const variant = product.selectedOrFirstAvailableVariant;

  if (!variant?.price?.amount) return null;

  const url = origin
    ? `${origin}/products/${encodeURIComponent(product.handle)}`
    : undefined;
  const images = product.images.nodes.map((image) => image.url).filter(Boolean);
  const description = product.seo?.description || product.description;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    ...(description ? {description} : {}),
    ...(images.length > 0 ? {image: images} : {}),
    ...(product.vendor ? {brand: {'@type': 'Brand', name: product.vendor}} : {}),
    ...(url ? {url} : {}),
    // Every product currently has a null sku; real ones should still emit it.
    ...(variant.sku ? {sku: variant.sku} : {}),
    offers: {
      '@type': 'Offer',
      price: variant.price.amount,
      priceCurrency: variant.price.currencyCode,
      // availableForSale, not inventory: "continue selling when out of stock"
      // means a zero-inventory variant can still be legitimately purchasable.
      availability: variant.availableForSale
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      ...(url ? {url} : {}),
    },
  };
}
