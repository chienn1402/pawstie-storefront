import type {Route} from './+types/[sitemap.xml]';
import {getSitemapIndex} from '@shopify/hydrogen';

export async function loader({
  request,
  context: {storefront},
}: Route.LoaderArgs) {
  const response = await getSitemapIndex({
    storefront,
    request,
  });

  // getSitemapIndex only knows about Shopify resources, so the hand-written
  // routes in /sitemap/static/1.xml have to be appended to its output.
  const baseUrl = new URL(request.url).origin;
  const body = (await response.text()).replace(
    '</sitemapindex>',
    `  <sitemap><loc>${baseUrl}/sitemap/static/1.xml</loc></sitemap>\n</sitemapindex>`,
  );

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': `max-age=${60 * 60 * 24}`,
    },
  });
}
