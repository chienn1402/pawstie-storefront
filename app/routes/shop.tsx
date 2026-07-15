import type {Route} from './+types/shop';
import {Link, useLoaderData} from 'react-router';
import {getPaginationVariables} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {ProductCard} from '~/components/ProductCard';
import {ShopControls} from '~/components/shop/ShopControls';
import {RECOMMENDED_PRODUCT_FRAGMENT} from '~/lib/fragments';
import {resolveCategory, resolveSort} from '~/lib/shop';
import type {
  RecommendedProductFragment,
  ShopProductsQuery,
} from 'storefrontapi.generated';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Pawstie | Shop'},
    {
      name: 'description',
      content:
        'Browse the whole Pawstie collection — walk, play, snooze, treat, and feeding essentials for happier pets.',
    },
  ];
};

export async function loader(args: Route.LoaderArgs) {
  return loadCriticalData(args);
}

async function loadCriticalData({context, request}: Route.LoaderArgs) {
  const {storefront} = context;
  const url = new URL(request.url);
  const category = resolveCategory(url.searchParams.get('category'));
  const sort = resolveSort(url.searchParams.get('sort'));
  const paginationVariables = getPaginationVariables(request, {pageBy: 12});

  let data: ShopProductsQuery;
  try {
    data = await storefront.query(SHOP_PRODUCTS_QUERY, {
      variables: {
        query: category.query,
        sortKey: sort.sortKey,
        reverse: sort.reverse,
        ...paginationVariables,
      },
    });
  } catch (error) {
    // Never 500 the browse page — fall back to an empty grid + empty state.
    console.error(error);
    data = {
      products: {
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
      },
    };
  }

  return {products: data.products, category: category.id, sort: sort.id};
}

export default function Shop() {
  const {products, category, sort} = useLoaderData<typeof loader>();
  const count = products.nodes.length;

  return (
    <div className="pb-20 lg:pb-28">
      <section className="px-6 pt-10 pb-6 lg:px-[7vw] lg:pt-14">
        <div className="mx-auto max-w-[80rem]">
          <p className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-primary">
            Shop all
          </p>
          <h1 className="mb-0 mt-3 font-heading text-5xl font-semibold leading-[0.95] tracking-[-0.05em] text-[#004817] sm:text-6xl">
            Everything your pets love
          </h1>
          <p className="mt-5 max-w-[34rem] text-lg leading-relaxed text-[#347345]">
            Browse the whole collection, or narrow it to the part of the day
            you&rsquo;re shopping for.
          </p>
        </div>
      </section>

      <ShopControls activeCategory={category} activeSort={sort} count={count} />

      <div className="mt-6 px-6 lg:px-[7vw]">
        <div className="mx-auto max-w-[80rem]">
          {count === 0 ? (
            <div className="rounded-[2rem] bg-[#effce9] px-6 py-16 text-center">
              <p className="mb-0 font-heading text-2xl font-semibold text-[#004817]">
                No products here yet
              </p>
              <p className="mt-3 text-[#347345]">
                Try another category to keep browsing.
              </p>
              <Link
                to="/shop"
                prefetch="intent"
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#00521d] px-6 font-heading text-sm font-semibold text-white! transition-colors hover:bg-[#006523] hover:no-underline! focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#00521d]"
              >
                View all products
              </Link>
            </div>
          ) : (
            <PaginatedResourceSection<RecommendedProductFragment>
              connection={products}
              ariaLabel="Products"
              resourcesClassName="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8"
            >
              {({node, index}) => (
                <ProductCard
                  key={node.id}
                  product={node}
                  loading={index < 8 ? 'eager' : 'lazy'}
                />
              )}
            </PaginatedResourceSection>
          )}
        </div>
      </div>
    </div>
  );
}

const SHOP_PRODUCTS_QUERY = `#graphql
  query ShopProducts(
    $country: CountryCode
    $language: LanguageCode
    $query: String
    $sortKey: ProductSortKeys
    $reverse: Boolean
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    products(
      query: $query
      sortKey: $sortKey
      reverse: $reverse
      first: $first
      last: $last
      before: $startCursor
      after: $endCursor
    ) {
      nodes {
        ...RecommendedProduct
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
  ${RECOMMENDED_PRODUCT_FRAGMENT}
` as const;
