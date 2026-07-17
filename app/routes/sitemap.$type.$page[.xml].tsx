import type {Route} from './+types/sitemap.$type.$page[.xml]';
import {getSitemap, type Storefront} from '@shopify/hydrogen';
import type {
  SitemapBlogArticlesQuery,
  SitemapBlogsQuery,
} from 'storefrontapi.generated';

export async function loader({
  request,
  params,
  context: {storefront},
}: Route.LoaderArgs) {
  const response =
    params.type === 'articles'
      ? await articlesSitemap({request, page: params.page, storefront})
      : await getSitemap({
          storefront,
          request,
          params,
          getLink: ({type, baseUrl, handle}) => `${baseUrl}/${type}/${handle}`,
        });

  response.headers.set('Cache-Control', `max-age=${60 * 60 * 24}`);

  return response;
}

/**
 * Articles are served from a custom sitemap because Shopify's ARTICLE sitemap
 * resource exposes only the article handle. This app routes articles as
 * /blogs/:blogHandle/:articleHandle, so the blog handle has to be queried
 * alongside each article to build a URL that resolves.
 */
async function articlesSitemap({
  request,
  page,
  storefront,
}: {
  request: Request;
  page?: string;
  storefront: Storefront;
}) {
  const pageNumber = Number(page);

  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    throw new Response('Not found', {status: 404});
  }

  const baseUrl = new URL(request.url).origin;
  const articles = await getArticleSitemapPage({page: pageNumber, storefront});
  // No <lastmod>: the Storefront API's Article type exposes only publishedAt,
  // which goes stale the moment an article is edited. Google ignores lastmod
  // values it finds unreliable, so omitting it beats publishing a wrong one.
  const urls = articles.map(({article, blogHandle}) =>
    renderUrl({
      loc: `${baseUrl}/blogs/${encodeURIComponent(
        blogHandle,
      )}/${encodeURIComponent(article.handle)}`,
    }),
  );

  // Google's Search Console flags empty sitemaps as errors, so fall back to the
  // homepage the same way Hydrogen's built-in generator does.
  const body =
    urls.length > 0 ? urls.join('\n') : renderUrl({loc: `${baseUrl}/`});

  return new Response(`${URLSET_OPEN}\n${body}\n${URLSET_CLOSE}`, {
    headers: {'Content-Type': 'application/xml'},
  });
}

async function getArticleSitemapPage({
  page,
  storefront,
}: {
  page: number;
  storefront: Storefront;
}) {
  const articles: Array<{
    article: {handle: string};
    blogHandle: string;
  }> = [];
  const offset = (page - 1) * SITEMAP_PAGE_SIZE;
  let seenArticles = 0;
  let blogsAfter: string | null = null;
  let hasNextBlogsPage = true;

  while (hasNextBlogsPage) {
    const data: SitemapBlogsQuery = await storefront.query(
      SITEMAP_BLOGS_QUERY,
      {
        variables: {
          articlesFirst: STOREFRONT_ARTICLES_PAGE_SIZE,
          blogsAfter,
          blogsFirst: STOREFRONT_BLOGS_PAGE_SIZE,
        },
      },
    );
    const blogs = data?.blogs;

    if (!blogs) break;

    for (const blog of blogs.nodes) {
      let articleConnection = blog.articles;

      while (articleConnection) {
        for (const article of articleConnection.nodes) {
          if (seenArticles++ < offset) continue;

          articles.push({article, blogHandle: blog.handle});

          if (articles.length === SITEMAP_PAGE_SIZE) return articles;
        }

        const {endCursor, hasNextPage} = articleConnection.pageInfo;

        if (!hasNextPage || !endCursor) break;

        const nextData: SitemapBlogArticlesQuery = await storefront.query(
          SITEMAP_BLOG_ARTICLES_QUERY,
          {
            variables: {
              after: endCursor,
              articlesFirst: STOREFRONT_ARTICLES_PAGE_SIZE,
              blogHandle: blog.handle,
            },
          },
        );

        if (!nextData?.blog) break;

        articleConnection = nextData.blog.articles;
      }
    }

    const {endCursor, hasNextPage} = blogs.pageInfo;
    hasNextBlogsPage = hasNextPage && Boolean(endCursor);
    blogsAfter = endCursor ?? null;
  }

  return articles;
}

function renderUrl({loc}: {loc: string}) {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <changefreq>weekly</changefreq>
  </url>`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const SITEMAP_PAGE_SIZE = 250;
const STOREFRONT_ARTICLES_PAGE_SIZE = 250;
const STOREFRONT_BLOGS_PAGE_SIZE = 50;

const URLSET_OPEN = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
const URLSET_CLOSE = '</urlset>';

const SITEMAP_BLOGS_QUERY = `#graphql
  query SitemapBlogs(
    $country: CountryCode
    $language: LanguageCode
    $blogsFirst: Int!
    $blogsAfter: String
    $articlesFirst: Int!
  ) @inContext(country: $country, language: $language) {
    blogs(first: $blogsFirst, after: $blogsAfter, sortKey: ID) {
      nodes {
        handle
        articles(first: $articlesFirst, sortKey: ID) {
          nodes {
            handle
          }
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
` as const;

const SITEMAP_BLOG_ARTICLES_QUERY = `#graphql
  query SitemapBlogArticles(
    $country: CountryCode
    $language: LanguageCode
    $blogHandle: String!
    $articlesFirst: Int!
    $after: String
  ) @inContext(country: $country, language: $language) {
    blog(handle: $blogHandle) {
      articles(first: $articlesFirst, after: $after, sortKey: ID) {
        nodes {
          handle
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  }
` as const;
