import {Suspense} from 'react';
import {Await} from 'react-router';
import type {RecommendedProductsQuery} from 'storefrontapi.generated';
import {ProductCard} from '~/components/ProductCard';

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
        <div className="max-w-[46rem]">
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

        <Suspense
          fallback={
            <div className="mt-12 text-[#347345] lg:mt-16">Loading…</div>
          }
        >
          <Await resolve={products}>
            {(response) => (
              <div className="mt-14 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:mt-20 lg:grid-cols-4 lg:gap-x-8">
                {response
                  ? response.products.nodes.map((product) => (
                      <ProductCard key={product.id} product={product} isNew />
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
