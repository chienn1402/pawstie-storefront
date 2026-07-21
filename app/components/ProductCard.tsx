import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {RecommendedProductFragment} from 'storefrontapi.generated';
import {ProductCardActions} from '~/components/ProductCardActions';
import {
  isPrintOnDemand,
  ProductPodBadge,
} from '~/components/ProductPodBadge';
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
  const isPod = isPrintOnDemand(product.printOnDemand);

  return (
    <article className="group relative flex min-w-0 flex-col">
      <div className="relative overflow-hidden rounded-[1.5rem] rounded-br-[3.75rem] bg-[#a4e8aa] lg:rounded-[2rem] lg:rounded-br-[4.75rem]">
        {isNew || isPod ? (
          <div className="pointer-events-none absolute left-2 top-0 z-10 flex flex-col items-start gap-2 sm:left-4">
            {isNew ? (
              <span className="rounded-b-xl bg-[#00521d] px-3 pb-2.5 pt-3.5 font-heading text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-white sm:pb-3 sm:pt-4 sm:text-xs">
                New
              </span>
            ) : null}
            {isPod ? (
              <ProductPodBadge
                className={`whitespace-nowrap px-2 text-[0.625rem] tracking-[0.08em] sm:px-2.5 sm:text-[0.6875rem] sm:tracking-[0.11em] ${isNew ? '' : 'mt-4'}`}
              />
            ) : null}
          </div>
        ) : null}
        {image ? (
          <Image
            alt={image.altText || product.title}
            aspectRatio="4/5"
            data={image}
            loading={loading}
            sizes="(min-width: 64em) 20vw, 45vw"
            className="size-full rounded-none! object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.025] motion-reduce:transition-none"
          />
        ) : (
          <div className="aspect-[4/5] w-full" />
        )}
      </div>

      <h3 className="mb-0 mt-5 font-heading text-base font-semibold leading-[1.25] tracking-[-0.025em] text-[#004817] sm:text-lg">
        <Link
          className="rounded-sm text-[#004817] after:absolute after:inset-0 after:content-[''] hover:text-[#00752d] hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00521d]"
          prefetch="intent"
          to={variantUrl}
        >
          {product.title}
        </Link>
      </h3>

      <p className="mt-1.5 font-heading text-sm font-bold text-primary sm:text-base">
        <Money as="span" data={product.priceRange.minVariantPrice} />
      </p>

      <ProductCardActions product={product} />
    </article>
  );
}
