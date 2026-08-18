import {Suspense} from 'react';
import {Await} from 'react-router';
import type {RecommendedProductFragment} from 'storefrontapi.generated';
import {ProductCard} from '~/components/ProductCard';

interface RelatedProductsProps {
  /** Already trimmed and de-duplicated by the product route's loader. */
  products: Promise<RecommendedProductFragment[]>;
}

export function RelatedProducts({products}: RelatedProductsProps) {
  return (
    <Suspense fallback={null}>
      <Await resolve={products} errorElement={null}>
        {(recommendations) => {
          if (recommendations.length === 0) return null;

          // `-mx-4 w-[calc(100%+2rem)]` cancels the `body > main` gutter in
          // reset.css so the green band runs edge to edge, same as the
          // full-bleed home sections.
          return (
            <section aria-labelledby="related-products-heading" data-related-products className="-mx-4 mt-16 w-[calc(100%+2rem)] overflow-hidden bg-[#effce9] px-6 py-16 lg:mt-24 lg:px-[7vw] lg:py-20">
              <div className="mx-auto max-w-[80rem]">
                <p className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-primary">More to sniff out</p>
                <h2 id="related-products-heading" className="mb-0 mt-4 max-w-[13ch] font-heading text-4xl font-semibold leading-[0.95] tracking-[-0.05em] text-[#004817] sm:text-5xl">You may also like</h2>
                <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:mt-16 lg:grid-cols-4 lg:gap-x-8">
                  {recommendations.map((product) => <ProductCard key={product.id} product={product} />)}
                </div>
              </div>
            </section>
          );
        }}
      </Await>
    </Suspense>
  );
}
