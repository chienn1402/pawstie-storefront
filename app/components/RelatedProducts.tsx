import {Suspense} from 'react';
import {Await} from 'react-router';
import type {RecommendedProductFragment} from 'storefrontapi.generated';
import {ProductCard} from '~/components/ProductCard';

interface RelatedProductsProps {
  products: Promise<{
    productRecommendations?: RecommendedProductFragment[] | null;
  } | null>;
}

export function RelatedProducts({products}: RelatedProductsProps) {
  return (
    <Suspense fallback={null}>
      <Await resolve={products} errorElement={null}>
        {(response) => {
          const recommendations = response?.productRecommendations?.slice(0, 4) ?? [];
          if (recommendations.length === 0) return null;

          return (
            <section aria-labelledby="related-products-heading" className="mt-16 overflow-hidden bg-[#effce9] px-6 py-16 lg:mt-24 lg:px-[7vw] lg:py-20">
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
