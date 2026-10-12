import {useLoaderData} from 'react-router';
import type {Route} from './+types/_index';
import {EverydayPromises} from '~/components/home/EverydayPromises';
import {FinalCallToAction} from '~/components/home/FinalCallToAction';
import {Hero} from '~/components/home/Hero';
import {MockShopNotice} from '~/components/home/MockShopNotice';
import {NewArrivals} from '~/components/home/NewArrivals';
import {ShopByRoutine} from '~/components/home/ShopByRoutine';
import {RECOMMENDED_PRODUCT_FRAGMENT} from '~/lib/fragments';
import {toHeroSlides, withFeaturedFirst} from '~/lib/hero';

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
 * Load data necessary for rendering content above the fold: the hero's product
 * story. Awaited, because its first slide is the page's LCP image and has to
 * be in the server HTML. A failed query must not 500 the page a paid click
 * lands on — the hero renders a fallback card from an empty list instead.
 *
 * `?hero=<handle>` puts that product first, so an ad can link to the home page
 * and still open on the product it was showing. Unknown handles are ignored.
 */
async function loadCriticalData({context, request}: Route.LoaderArgs) {
  const featuredHandle =
    new URL(request.url).searchParams.get('hero')?.trim().slice(0, 255) ?? '';

  const heroSlides = await context.storefront
    .query(HERO_PRODUCTS_QUERY, {variables: {featuredHandle}})
    .then(({featured, products}) =>
      toHeroSlides(withFeaturedFirst(featured, products.nodes)),
    )
    .catch((error: Error) => {
      console.error(error);
      return [];
    });

  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
    heroSlides,
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
      <Hero slides={data.heroSlides} />
      <NewArrivals products={data.recommendedProducts} />
      <EverydayPromises />
      <ShopByRoutine />
      <FinalCallToAction />
    </div>
  );
}

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
  ${RECOMMENDED_PRODUCT_FRAGMENT}
` as const;

/**
 * The hero's story card. Best sellers first — `toHeroSlides` then drops
 * anything sold out or without a photo, and interleaves by routine so the
 * headline word actually rotates. Eight in, at most seven out: one spare for a
 * product that gets filtered.
 *
 * `featured` is the `?hero=` product. An empty handle matches nothing and
 * comes back null, so one query serves both cases.
 */
const HERO_PRODUCTS_QUERY = `#graphql
  fragment HeroProduct on Product {
    id
    title
    handle
    featuredImage {
      id
      url
      altText
      width
      height
    }
    selectedOrFirstAvailableVariant(
      selectedOptions: []
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      availableForSale
      price {
        amount
        currencyCode
      }
      compareAtPrice {
        amount
        currencyCode
      }
    }
  }
  query HeroProducts(
    $country: CountryCode
    $language: LanguageCode
    $featuredHandle: String!
  ) @inContext(country: $country, language: $language) {
    featured: product(handle: $featuredHandle) {
      ...HeroProduct
    }
    products(first: 8, sortKey: BEST_SELLING) {
      nodes {
        ...HeroProduct
      }
    }
  }
` as const;
