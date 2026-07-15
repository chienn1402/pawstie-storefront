import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/blogs._index';
import {getPaginationVariables} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import type {BlogsQuery} from 'storefrontapi.generated';

type BlogNode = BlogsQuery['blogs']['nodes'][0];

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Pawstie | Journal'},
    {
      name: 'description',
      content: 'Stories, tips, and pet-care notes from the Pawstie team.',
    },
  ];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, request}: Route.LoaderArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 10,
  });

  const [{blogs}] = await Promise.all([
    context.storefront.query(BLOGS_QUERY, {
      variables: {
        ...paginationVariables,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {blogs};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Blogs() {
  const {blogs} = useLoaderData<typeof loader>();

  return (
    <div className="pb-20 lg:pb-28">
      <section className="px-6 pt-10 pb-6 lg:px-[7vw] lg:pt-14">
        <div className="mx-auto max-w-[80rem]">
          <p className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-primary">
            The Pawstie journal
          </p>
          <h1 className="mb-0 mt-3 font-heading text-5xl font-semibold leading-[0.95] tracking-[-0.05em] text-[#004817] sm:text-6xl">
            Read the journal
          </h1>
          <p className="mt-5 max-w-[34rem] text-lg leading-relaxed text-[#347345]">
            Pick a collection of stories, tips, and pet-care notes to dig into.
          </p>
        </div>
      </section>

      <div className="mt-6 px-6 lg:px-[7vw]">
        <div className="mx-auto max-w-[80rem]">
          <PaginatedResourceSection<BlogNode>
            connection={blogs}
            ariaLabel="Blogs"
            resourcesClassName="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {({node: blog}) => (
              <Link
                className="group relative flex min-h-[9rem] flex-col justify-end overflow-hidden rounded-[1.5rem] rounded-br-[3.75rem] bg-[#effce9] p-6 transition-colors hover:bg-[#dff7d4] hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#00521d] lg:rounded-[2rem] lg:rounded-br-[4.75rem]"
                key={blog.handle}
                prefetch="intent"
                to={`/blogs/${blog.handle}`}
              >
                <h2 className="mb-0 font-heading text-2xl font-semibold leading-[1.1] tracking-[-0.03em] text-[#004817]">
                  {blog.title}
                </h2>
                <span className="mt-2 font-heading text-sm font-bold text-[#00521d] transition-colors group-hover:text-[#006523]">
                  Read stories <span aria-hidden="true">→</span>
                </span>
              </Link>
            )}
          </PaginatedResourceSection>
        </div>
      </div>
    </div>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/blog
const BLOGS_QUERY = `#graphql
  query Blogs(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    blogs(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        title
        handle
        seo {
          title
          description
        }
      }
    }
  }
` as const;
