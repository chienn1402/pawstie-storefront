import {Suspense} from 'react';
import {Await, Link} from 'react-router';
import type {RecommendedProductsQuery} from 'storefrontapi.generated';
import {ArrowRightIcon} from '~/components/icons';
import {ProductItem} from '~/components/ProductItem';

const CTA_HREF = '/collections/all';

interface NewArrivalsProps {
  products: Promise<RecommendedProductsQuery | null>;
}

export function NewArrivals({products}: NewArrivalsProps) {
  return (
    <section
      aria-labelledby="new-arrivals-heading"
      className="-mx-4 w-[calc(100%+2rem)] overflow-hidden bg-[#effce9] px-6 py-20 lg:px-[7vw] lg:py-28"
    >
      <div className="mx-auto max-w-[80rem]">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16">
          <div className="min-w-0">
            <p className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-primary">
              New this week
            </p>
            <h2
              id="new-arrivals-heading"
              className="mb-0 mt-4 max-w-[13ch] font-heading text-5xl font-semibold leading-[0.9] tracking-[-0.065em] text-[#004817] sm:text-6xl lg:text-7xl"
            >
              Just landed. Already loved.
            </h2>
            <p className="mt-8 max-w-[31rem] text-lg leading-relaxed text-[#347345]">
              The newest toys, beds, and treats to reach the shelf — picked the
              moment they arrived.
            </p>
          </div>

          <Link
            to={CTA_HREF}
            className="group inline-flex min-h-16 shrink-0 items-center gap-5 self-start rounded-full bg-primary py-2 pl-8 pr-2 font-heading text-lg font-semibold text-white shadow-[0_12px_28px_-10px_rgba(169,83,14,0.5)] transition-[transform,box-shadow,background-color] duration-300 hover:-translate-y-0.5 hover:bg-[#8f440b] hover:no-underline hover:shadow-[0_20px_38px_-12px_rgba(169,83,14,0.65)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00521d] motion-reduce:transition-none motion-reduce:hover:translate-y-0 lg:self-auto lg:text-xl"
          >
            Shop all new
            <span className="relative grid size-12 place-items-center overflow-hidden rounded-full bg-white text-primary">
              <ArrowRightIcon className="size-5 transition-transform duration-300 motion-safe:group-hover:translate-x-[220%]" />
              <ArrowRightIcon className="absolute size-5 -translate-x-[220%] transition-transform duration-300 motion-safe:group-hover:translate-x-0" />
            </span>
          </Link>
        </div>

        <Suspense
          fallback={
            <div className="mt-12 text-[#347345] lg:mt-16">Loading…</div>
          }
        >
          <Await resolve={products}>
            {(response) => (
              <div className="mt-12 grid grid-cols-2 gap-5 lg:mt-16 lg:grid-cols-4 lg:gap-6">
                {response
                  ? response.products.nodes.map((product) => (
                      <ProductItem key={product.id} product={product} isNew />
                    ))
                  : null}
              </div>
            )}
          </Await>
        </Suspense>
      </div>
    </section>
  );
}
