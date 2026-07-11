import {Await, Link, useLoaderData} from 'react-router';
import type {Route} from './+types/_index';
import {Suspense} from 'react';
import type {RecommendedProductsQuery} from 'storefrontapi.generated';
import {ProductItem} from '~/components/ProductItem';
import {MockShopNotice} from '~/components/MockShopNotice';
import {Hero} from '~/components/Hero';
import {ArrowRightIcon, PawIcon} from '~/components/icons';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Pawstie | Home'}];
};

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. The hero is static,
 * so there are no above-the-fold Storefront queries here.
 */
function loadCriticalData({context}: Route.LoaderArgs) {
  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error: Error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  return {
    recommendedProducts,
  };
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="home">
      {data.isShopLinked ? null : <MockShopNotice />}
      <Hero />
      <NewArrivals products={data.recommendedProducts} />
    </div>
  );
}

const NEW_ARRIVALS_CTA_HREF = '/collections/all';

function NewArrivals({
  products,
}: {
  products: Promise<RecommendedProductsQuery | null>;
}) {
  return (
    <section
      aria-labelledby="new-arrivals-heading"
      className="-mx-4 w-[calc(100%+2rem)] overflow-hidden bg-[#effce9] px-6 py-14 lg:px-[7vw] lg:py-20"
    >
      <div className="mx-auto max-w-[80rem]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col items-start">
            <span
              aria-hidden="true"
              className="grid size-11 place-items-center rounded-full bg-white text-primary ring-2 ring-[#a4e8aa]"
            >
              <PawIcon className="size-5" />
            </span>
            <h2
              id="new-arrivals-heading"
              className="mb-0! mt-4! font-heading text-4xl font-semibold leading-[0.95] tracking-[-0.06em] text-[#004817] lg:text-6xl"
            >
              New Arrivals
            </h2>
          </div>
          <Link
            to={NEW_ARRIVALS_CTA_HREF}
            className="hidden min-h-14 items-center gap-4 self-end rounded-full bg-primary py-2 pl-7 pr-2 text-lg font-semibold text-primary-foreground transition-transform hover:scale-[1.02] hover:no-underline! focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00521d] lg:inline-flex"
          >
            Explore all
            <span className="grid size-11 place-items-center rounded-full bg-[#effce9] text-primary">
              <ArrowRightIcon className="size-5" />
            </span>
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
          to={NEW_ARRIVALS_CTA_HREF}
          className="mt-10 flex min-h-14 items-center justify-center gap-4 rounded-full bg-primary px-7 text-lg font-semibold text-primary-foreground transition-transform hover:scale-[1.01] hover:no-underline! focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00521d] lg:hidden"
        >
          Explore all
          <span className="grid size-11 place-items-center rounded-full bg-[#effce9] text-primary">
            <ArrowRightIcon className="size-5" />
          </span>
        </Link>
      </div>
    </section>
  );
}

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
` as const;
