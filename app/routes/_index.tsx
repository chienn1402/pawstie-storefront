import {useLoaderData} from 'react-router';
import type {Route} from './+types/_index';
import {EverydayPromises} from '~/components/home/EverydayPromises';
import {FinalCallToAction} from '~/components/home/FinalCallToAction';
import {Hero} from '~/components/home/Hero';
import {MockShopNotice} from '~/components/home/MockShopNotice';
import {NewArrivals} from '~/components/home/NewArrivals';
import {ShopByRoutine} from '~/components/home/ShopByRoutine';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Pawstie | Everything Your Pets Love'},
    {
      name: 'description',
      content:
        'Playful, comfortable essentials for happier days with dogs and cats.',
    },
  ];
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
      <EverydayPromises />
      <ShopByRoutine />
      <FinalCallToAction />
    </div>
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
