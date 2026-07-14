import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {RecommendedProductFragment} from 'storefrontapi.generated';
import {ProductCardActions} from '~/components/ProductCardActions';
import {useVariantUrl} from '~/lib/variants';

export function ProductCard({
  product,
  loading,
  isNew = false,
}: {
  product: RecommendedProductFragment;
  loading?: 'eager' | 'lazy';
  isNew?: boolean;
}) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;

  return (
    <div className="group relative flex flex-col rounded-[1.75rem] bg-white p-3 shadow-[0_18px_30px_-20px_rgba(1,51,18,0.35)] ring-1 ring-[#d6f3d0] transition duration-200 hover:-translate-y-1 hover:shadow-[0_26px_42px_-20px_rgba(1,51,18,0.45)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 lg:rounded-[2rem]">
      <div className="relative overflow-hidden rounded-[1.25rem] bg-[#a4e8aa] lg:rounded-[1.5rem]">
        {isNew ? (
          <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-white px-3 py-1.5 font-heading text-xs font-semibold uppercase tracking-[0.12em] text-[#00521d] shadow-sm">
            New
          </span>
        ) : null}
        {image ? (
          <Image
            alt={image.altText || product.title}
            aspectRatio="4/5"
            data={image}
            loading={loading}
            sizes="(min-width: 64em) 20vw, 45vw"
            className="size-full rounded-none! object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="aspect-[4/5] w-full" />
        )}
        <ProductCardActions product={product} />
      </div>

      <h3 className="mb-0 mt-4 font-heading text-lg font-semibold leading-snug tracking-[-0.02em] text-[#004817]">
        <Link
          className="rounded-sm text-[#004817] after:absolute after:inset-0 after:content-[''] hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00521d]"
          prefetch="intent"
          to={variantUrl}
        >
          {product.title}
        </Link>
      </h3>

      <p className="mt-1 font-heading text-base font-semibold text-[#347345]">
        <Money as="span" data={product.priceRange.minVariantPrice} />
      </p>
    </div>
  );
}
