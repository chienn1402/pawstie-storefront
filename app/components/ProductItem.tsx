import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {
  ProductItemFragment,
  CollectionItemFragment,
  RecommendedProductFragment,
} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';

export function ProductItem({
  product,
  loading,
  isNew = false,
}: {
  product:
    | CollectionItemFragment
    | ProductItemFragment
    | RecommendedProductFragment;
  loading?: 'eager' | 'lazy';
  isNew?: boolean;
}) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;
  return (
    <Link
      className="product-item group flex flex-col rounded-3xl bg-white p-3 shadow-[0_18px_30px_-20px_rgba(1,51,18,0.35)] ring-1 ring-[#d6f3d0] transition duration-200 hover:-translate-y-1 hover:no-underline! hover:shadow-[0_26px_42px_-20px_rgba(1,51,18,0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00521d]"
      key={product.id}
      prefetch="intent"
      to={variantUrl}
    >
      <div className="relative overflow-hidden rounded-2xl bg-[#effce9]">
        {isNew ? (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-[#00521d] px-3 py-1 font-heading text-xs font-semibold uppercase tracking-wide text-white">
            New
          </span>
        ) : null}
        {image && (
          <Image
            alt={image.altText || product.title}
            aspectRatio="1/1"
            data={image}
            loading={loading}
            sizes="(min-width: 45em) 400px, 100vw"
            className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )}
      </div>
      <h4 className="mb-1! mt-3! font-heading text-base font-semibold leading-snug text-[#004817]">
        {product.title}
      </h4>
      <small className="font-heading text-sm font-semibold text-[#347345]">
        <Money data={product.priceRange.minVariantPrice} />
      </small>
    </Link>
  );
}
