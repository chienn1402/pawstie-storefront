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
      className="-mx-4 w-[calc(100%+2rem)] overflow-hidden bg-[#effce9] px-6! py-14! lg:px-[7vw]! lg:py-20!"
    >
      <div className="mx-auto max-w-[80rem]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <h2
            id="new-arrivals-heading"
            className="m-0! font-heading text-3xl! font-semibold! leading-none! tracking-[-0.04em] text-[#004817] lg:text-[2.5rem]!"
          >
            New Arrivals
          </h2>
          <Link
            to={CTA_HREF}
            className="group hidden min-h-11 items-center gap-2 self-end rounded-sm text-lg font-semibold text-[#004817]! underline decoration-2 decoration-primary underline-offset-4 transition-colors hover:text-primary! focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00521d] lg:inline-flex lg:self-auto"
          >
            View all
            <ArrowRightIcon className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-1" />
          </Link>
        </div>

        <Suspense
          fallback={<div className="mt-10 text-[#347345]">Loading…</div>}
        >
          <Await resolve={products}>
            {(response) => (
              <div className="mt-10 grid grid-cols-2 gap-5 lg:mt-12 lg:grid-cols-4 lg:gap-6">
                {response
                  ? response.products.nodes.map((product) => (
                      <ProductItem key={product.id} product={product} isNew />
                    ))
                  : null}
              </div>
            )}
          </Await>
        </Suspense>

        <Link
          to={CTA_HREF}
          className="group mt-10 flex min-h-11 justify-center items-center gap-2 rounded-sm text-lg font-semibold text-[#004817]! underline decoration-2 decoration-primary underline-offset-4 transition-colors hover:text-primary! focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00521d] lg:hidden"
        >
          View all
          <ArrowRightIcon className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
