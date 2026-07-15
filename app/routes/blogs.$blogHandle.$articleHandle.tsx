import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/blogs.$blogHandle.$articleHandle';
import {Image} from '@shopify/hydrogen';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';

export const meta: Route.MetaFunction = ({data}) => {
  return [
    {title: `Pawstie | ${data?.article.title ?? 'Article'}`},
    {
      name: 'description',
      content: data?.article.seo?.description ?? '',
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
  const {blogHandle, articleHandle} = params;

  if (!articleHandle || !blogHandle) {
    throw new Response('Not found', {status: 404});
  }

  const [{blog}] = await Promise.all([
    context.storefront.query(ARTICLE_QUERY, {
      variables: {blogHandle, articleHandle},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!blog?.articleByHandle) {
    throw new Response(null, {status: 404});
  }

  redirectIfHandleIsLocalized(
    request,
    {
      handle: articleHandle,
      data: blog.articleByHandle,
    },
    {
      handle: blogHandle,
      data: blog,
    },
  );

  const article = blog.articleByHandle;

  return {article, blogHandle};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Article() {
  const {article, blogHandle} = useLoaderData<typeof loader>();
  const {title, image, contentHtml, author} = article;

  const publishedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(article.publishedAt));

  return (
    <article className="pb-20 lg:pb-28">
      <div className="px-6 pt-10 pb-8 lg:px-[7vw] lg:pt-14">
        <div className="mx-auto max-w-[48rem]">
          <Link
            to={`/blogs/${blogHandle}`}
            prefetch="intent"
            className="inline-flex items-center gap-1.5 font-heading text-sm font-semibold text-[#00521d] hover:text-[#006523] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#00521d]"
          >
            <span aria-hidden="true">←</span> Back to journal
          </Link>
          <h1 className="mb-0 mt-6 font-heading text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-[#004817] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 font-heading text-sm font-bold uppercase tracking-[0.14em] text-primary">
            <time dateTime={article.publishedAt}>{publishedDate}</time>
            {author?.name ? (
              <span className="text-[#347345]"> · {author.name}</span>
            ) : null}
          </p>
        </div>
      </div>

      {image ? (
        <div className="px-6 lg:px-[7vw]">
          <div className="mx-auto max-w-[60rem] overflow-hidden rounded-[1.5rem] rounded-br-[3.75rem] bg-[#a4e8aa] lg:rounded-[2rem] lg:rounded-br-[4.75rem]">
            <Image
              data={image}
              sizes="(min-width: 64em) 60rem, 90vw"
              loading="eager"
              className="size-full rounded-none! object-cover"
            />
          </div>
        </div>
      ) : null}

      <div className="mt-10 px-6 lg:px-[7vw]">
        <div
          className="mx-auto max-w-[48rem] text-[#347345] [&_a]:text-[#00521d] [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-[#006523] [&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-[#a4e8aa] [&_blockquote]:pl-5 [&_blockquote]:italic [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-[#004817] [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:font-heading [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-[#004817] [&_img]:my-6 [&_img]:rounded-[1.25rem] [&_li]:mb-2 [&_li]:leading-relaxed [&_ol]:mb-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-5 [&_p]:leading-relaxed [&_strong]:font-semibold [&_strong]:text-[#004817] [&_ul]:mb-5 [&_ul]:list-disc [&_ul]:pl-6"
          dangerouslySetInnerHTML={{__html: contentHtml}}
        />
      </div>
    </article>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/blog#field-blog-articlebyhandle
const ARTICLE_QUERY = `#graphql
  query Article(
    $articleHandle: String!
    $blogHandle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    blog(handle: $blogHandle) {
      handle
      articleByHandle(handle: $articleHandle) {
        handle
        title
        contentHtml
        publishedAt
        author: authorV2 {
          name
        }
        image {
          id
          altText
          url
          width
          height
        }
        seo {
          description
          title
        }
      }
    }
  }
` as const;
