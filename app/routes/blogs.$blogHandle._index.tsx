import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/blogs.$blogHandle._index';
import {Image, getPaginationVariables} from '@shopify/hydrogen';
import type {ArticleItemFragment} from 'storefrontapi.generated';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';

export const meta: Route.MetaFunction = ({data}) => {
  return [
    {title: `Pawstie | ${data?.blog.title ?? 'Journal'}`},
    {
      name: 'description',
      content:
        data?.blog.seo?.description ??
        'Stories, tips, and pet-care notes from the Pawstie team.',
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
async function loadCriticalData({context, request, params}: Route.LoaderArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 6,
  });

  if (!params.blogHandle) {
    throw new Response(`blog not found`, {status: 404});
  }

  const [{blog}] = await Promise.all([
    context.storefront.query(BLOGS_QUERY, {
      variables: {
        blogHandle: params.blogHandle,
        ...paginationVariables,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!blog?.articles) {
    throw new Response('Not found', {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle: params.blogHandle, data: blog});

  return {blog};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Blog() {
  const {blog} = useLoaderData<typeof loader>();
  const {articles} = blog;
  const hasArticles = articles.nodes.length > 0;

  return (
    <div className="pb-20 lg:pb-28">
      <section className="px-6 pt-10 pb-6 lg:px-[7vw] lg:pt-14">
        <div className="mx-auto max-w-[80rem]">
          <p className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-primary">
            The Pawstie journal
          </p>
          <h1 className="mb-0 mt-3 font-heading text-5xl font-semibold leading-[0.95] tracking-[-0.05em] text-[#004817] sm:text-6xl">
            {blog.title}
          </h1>
          <p className="mt-5 max-w-[34rem] text-lg leading-relaxed text-[#347345]">
            Stories, tips, and pet-care notes to help every day with your pets
            go a little smoother.
          </p>
        </div>
      </section>

      <div className="mt-6 px-6 lg:px-[7vw]">
        <div className="mx-auto max-w-[80rem]">
          {hasArticles ? (
            <PaginatedResourceSection<ArticleItemFragment>
              connection={articles}
              ariaLabel="Articles"
              resourcesClassName="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3"
            >
              {({node: article, index}) => (
                <ArticleItem
                  article={article}
                  key={article.id}
                  loading={index < 3 ? 'eager' : 'lazy'}
                />
              )}
            </PaginatedResourceSection>
          ) : (
            <div className="rounded-[2rem] bg-[#effce9] px-6 py-16 text-center">
              <h2 className="mb-0 font-heading text-2xl font-semibold text-[#004817]">
                No stories yet
              </h2>
              <p className="mt-3 text-[#347345]">
                We&rsquo;re working on the first ones. Check back soon.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ArticleItem({
  article,
  loading,
}: {
  article: ArticleItemFragment;
  loading?: HTMLImageElement['loading'];
}) {
  const publishedAt = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(article.publishedAt!));

  return (
    <article className="group relative flex min-w-0 flex-col">
      <div className="relative overflow-hidden rounded-[1.5rem] rounded-br-[3.75rem] bg-[#a4e8aa] lg:rounded-[2rem] lg:rounded-br-[4.75rem]">
        {article.image ? (
          <Image
            alt={article.image.altText || article.title}
            aspectRatio="3/2"
            data={article.image}
            loading={loading}
            sizes="(min-width: 64em) 30vw, (min-width: 40em) 45vw, 100vw"
            className="size-full rounded-none! object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.025] motion-reduce:transition-none"
          />
        ) : (
          <div className="aspect-[3/2] w-full" />
        )}
      </div>

      <p className="mt-5 font-heading text-xs font-bold uppercase tracking-[0.14em] text-primary">
        <time dateTime={article.publishedAt}>{publishedAt}</time>
        {article.author?.name ? (
          <span className="text-[#347345]"> · {article.author.name}</span>
        ) : null}
      </p>

      <h2 className="mb-0 mt-2 font-heading text-xl font-semibold leading-[1.2] tracking-[-0.025em] text-[#004817]">
        <Link
          className="rounded-sm text-[#004817] after:absolute after:inset-0 after:content-[''] hover:text-[#00752d] hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00521d]"
          prefetch="intent"
          to={`/blogs/${article.blog.handle}/${article.handle}`}
        >
          {article.title}
        </Link>
      </h2>

      {article.excerpt ? (
        <p className="mt-2 line-clamp-3 leading-relaxed text-[#347345]">
          {article.excerpt}
        </p>
      ) : null}
    </article>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/blog
const BLOGS_QUERY = `#graphql
  query Blog(
    $language: LanguageCode
    $blogHandle: String!
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(language: $language) {
    blog(handle: $blogHandle) {
      title
      handle
      seo {
        title
        description
      }
      articles(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
      ) {
        nodes {
          ...ArticleItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
  fragment ArticleItem on Article {
    author: authorV2 {
      name
    }
    contentHtml
    excerpt
    handle
    id
    image {
      id
      altText
      url
      width
      height
    }
    publishedAt
    title
    blog {
      handle
    }
  }
` as const;
