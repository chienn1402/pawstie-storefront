import type {Route} from './+types/lp.leather';
import {useLoaderData} from 'react-router';
import {Analytics} from '@shopify/hydrogen';
import type {LeatherLandingProductsQuery} from 'storefrontapi.generated';
import {LeatherCollection} from '~/components/leather/LeatherCollection';
import {LeatherFaq} from '~/components/leather/LeatherFaq';
import {LeatherFinalCta} from '~/components/leather/LeatherFinalCta';
import {LeatherFit} from '~/components/leather/LeatherFit';
import {LeatherHero} from '~/components/leather/LeatherHero';
import {LeatherPillars} from '~/components/leather/LeatherPillars';
import {LeatherSpotlight} from '~/components/leather/LeatherSpotlight';
import {LeatherStickyCta} from '~/components/leather/LeatherStickyCta';
import {LANDING_CHROME} from '~/lib/chrome';
import {RECOMMENDED_PRODUCT_FRAGMENT} from '~/lib/fragments';
import {
  LEATHER_HERO_HANDLE,
  LEATHER_NAMEPLATE_HANDLE,
  LEATHER_SEARCH_QUERY,
  lowestPrice,
  orderLeatherProducts,
} from '~/lib/leather';

const TITLE = 'Genuine Leather Collars & Leashes | Pawstie';
const DESCRIPTION =
  'Dog collars and leashes cut from 100% first-layer genuine leather, with solid alloy hardware and free engraving on the nameplate collars.';

/**
 * Paid-social landing page for the leather range (TikTok / Instagram / Meta).
 *
 * **This page must never be indexed.** It exists to receive ad clicks, and it
 * competes with `/shop` and the product pages for the same terms — an indexed
 * copy of the catalogue's best products would split the store's own rankings.
 * Two mechanisms enforce that, and both are deliberate:
 *
 * 1. `robots` meta plus an `X-Robots-Tag` header, so it holds for crawlers that
 *    never parse the HTML body.
 * 2. It is absent from `STATIC_ROUTES` in the sitemap route, so it is never
 *    submitted.
 *
 * What is deliberately *not* used is a `Disallow` in `robots.txt`. Disallowing
 * the URL would stop crawlers fetching it at all — including from reading the
 * `noindex` above — which is how a blocked URL still ends up indexed, listed
 * with no description, when something links to it. Crawlable-and-noindex is the
 * combination that actually keeps it out. See the note in `[robots.txt].tsx`.
 */
export const meta: Route.MetaFunction = ({data}) => {
  const image = data?.heroProduct?.featuredImage?.url;

  return [
    {title: TITLE},
    {name: 'description', content: DESCRIPTION},
    {name: 'robots', content: 'noindex, nofollow'},
    // Ad platforms and messaging apps scrape these to build the link preview
    // that renders in-feed, and they ignore `robots` while doing it.
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: TITLE},
    {property: 'og:description', content: DESCRIPTION},
    {name: 'twitter:card', content: 'summary_large_image'},
    ...(image
      ? [
          {property: 'og:image', content: image},
          {name: 'twitter:image', content: image},
        ]
      : []),
  ];
};

export const headers: Route.HeadersFunction = () => ({
  'X-Robots-Tag': 'noindex, nofollow',
});

/**
 * Drops the store nav for logo-only chrome. The full header and footer offer
 * fifteen ways off a page that costs money per visit, four of them twice over.
 */
export const handle = LANDING_CHROME;

/** `...RecommendedProduct` plus the extra `images` this page asks for. */
type LeatherProduct = LeatherLandingProductsQuery['products']['nodes'][number];

export async function loader({context}: Route.LoaderArgs) {
  const {storefront} = context;

  let products: LeatherProduct[] = [];

  try {
    const data: LeatherLandingProductsQuery = await storefront.query(
      LEATHER_LANDING_PRODUCTS_QUERY,
      {variables: {query: LEATHER_SEARCH_QUERY}},
    );
    products = orderLeatherProducts(data.products.nodes);
  } catch (error) {
    // A paid click must never see a 500. The page still renders its copy, and
    // the grid falls back to its restocking state with a link into the shop.
    console.error(error);
  }

  const byHandle = (handle: string) =>
    products.find((product) => product.handle === handle) ?? null;

  return {
    products,
    // The hero falls back to whatever sorted first so the layout survives the
    // flagship being renamed, unpublished or sold out.
    heroProduct: byHandle(LEATHER_HERO_HANDLE) ?? products[0] ?? null,
    nameplateProduct: byHandle(LEATHER_NAMEPLATE_HANDLE),
    fromPrice: lowestPrice(products),
  };
}

export default function LeatherLandingPage() {
  const {products, heroProduct, nameplateProduct, fromPrice} =
    useLoaderData<typeof loader>();

  // Only describe the hero shot when the hero really is the flagship — it falls
  // back to whatever sorted first, and a hardcoded description of a product
  // that is no longer on screen is worse than the generic title.
  const airtagProduct =
    heroProduct?.handle === LEATHER_HERO_HANDLE ? heroProduct : null;

  return (
    <div className="bg-[#faf4ec]">
      <LeatherHero
        heroProduct={heroProduct}
        fromPrice={fromPrice}
        imageAlt={
          airtagProduct
            ? 'A yellow Labrador seen from behind on a grass verge, wearing a tan leather collar with a round AirTag pocket riveted into the strap and a leash clipped to the ring.'
            : null
        }
      />
      <LeatherStickyCta fromPrice={fromPrice} />
      <LeatherPillars />

      {airtagProduct ? (
        <LeatherSpotlight
          product={airtagProduct}
          tone="sand"
          eyebrow="The flagship"
          heading="Your tracker, built into the strap."
          copy="The pocket is moulded into the leather and riveted shut, so the tracker sits flat against the neck instead of swinging off a keyring."
          points={[
            'Moulded to fit an Apple AirTag, riveted so it stays put.',
            '100% first-layer genuine leather that softens with wear.',
            'Solid alloy buckle and reinforced leash ring, rated for pull force.',
            'Bevelled lining — nothing rubbing on a long walk.',
            'Small, medium and large, in black, army green or orange.',
          ]}
          ctaLabel="Shop the AirTag collar"
          footnote="The AirTag itself is not included — the pocket is moulded to fit one, the tracker is bought separately."
          // Second shot, not the featured one — the hero is already showing
          // that photo a screen and a half further up.
          image={airtagProduct.images.nodes[1]}
          imageAlt="An army green leather collar photographed against white, showing the moulded AirTag pocket riveted into the strap beside the alloy buckle."
        />
      ) : null}

      <LeatherCollection products={products} />

      {nameplateProduct ? (
        <LeatherSpotlight
          product={nameplateProduct}
          tone="sand"
          reverse
          eyebrow="Made yours"
          heading="Their name on it. Your number under it."
          copy="A brass plate riveted flat into the leather, laser-etched with your dog’s name and your number. Nothing to jingle, catch, or go missing on the one day it matters."
          points={[
            'Etched deep enough to stay legible for years, not printed ink.',
            'Sits flush with the strap: silent indoors, snag-free outside.',
            'Genuine leather, reinforced pin buckle, sturdy leash D-ring.',
            'Engraving included — add the details when you add to cart.',
          ]}
          ctaLabel="Personalize a collar"
          footnote="Engraving is permanent, so check the spelling and the phone number before you check out."
          imageAlt="Two dark brown leather collars with gold hardware, the upper one showing a brass nameplate riveted flush into the strap and engraved with a pet's name and phone number."
        />
      ) : null}

      <LeatherFit />
      <LeatherFaq />
      <LeatherFinalCta />

      {/* Lets the campaign be attributed in Shopify analytics without a
          third-party pixel. `custom_` prefix is required by Hydrogen. */}
      <Analytics.CustomView
        type="custom_landing_page_viewed"
        data={{
          landingPage: 'leather',
          products: products.map(({id, title}) => ({id, title})),
        }}
      />
    </div>
  );
}

const LEATHER_LANDING_PRODUCTS_QUERY = `#graphql
  query LeatherLandingProducts(
    $country: CountryCode
    $language: LanguageCode
    $query: String
  ) @inContext(country: $country, language: $language) {
    products(first: 24, query: $query) {
      nodes {
        ...RecommendedProduct
        # The spotlight sections need a *second* shot: the hero already shows
        # the flagship's featured image, and running the same photo twice on
        # one page reads as a mistake. Two is all any section uses.
        images(first: 2) {
          nodes {
            id
            url
            altText
            width
            height
          }
        }
      }
    }
  }
  ${RECOMMENDED_PRODUCT_FRAGMENT}
` as const;
