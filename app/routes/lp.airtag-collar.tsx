import type {Route} from './+types/lp.airtag-collar';
import {Link, useLoaderData} from 'react-router';
import {Analytics} from '@shopify/hydrogen';
import type {AirtagLandingProductQuery} from 'storefrontapi.generated';
import {AirtagChooser} from '~/components/airtag/AirtagChooser';
import {AirtagHero} from '~/components/airtag/AirtagHero';
import {
  AIRTAG_CHOOSER_HREF,
  AIRTAG_CTA_SECTION_IDS,
  AIRTAG_FINAL_CTA_ID,
  AIRTAG_HERO_ID,
} from '~/components/airtag/anchors';
import {LandingFaq, FAQ_LINK, type Faq} from '~/components/landing/LandingFaq';
import {LandingFinalCta} from '~/components/landing/LandingFinalCta';
import {LandingPillars, type Pillar} from '~/components/landing/LandingPillars';
import {LandingStickyCta} from '~/components/landing/LandingStickyCta';
import {ProductSpotlight} from '~/components/landing/ProductSpotlight';
import {LANDING_CHROME} from '~/lib/chrome';
import {LEATHER_HERO_HANDLE} from '~/lib/leather';
import {RECOMMENDED_PRODUCT_FRAGMENT} from '~/lib/fragments';

const TITLE = 'Leather AirTag Dog Collar | Pawstie';
const DESCRIPTION =
  'A genuine leather dog collar with the AirTag pocket moulded into the strap and riveted shut — flush against the neck, with nothing to snag or work loose.';

/**
 * Single-product landing page for paid social (TikTok / Instagram / Meta).
 *
 * Noindex, for the same reasons as `/lp/leather`: robots meta plus an
 * X-Robots-Tag header, absent from the sitemap, and deliberately *not*
 * disallowed in robots.txt — a Disallow stops crawlers reading the noindex.
 *
 * **On what this page may claim.** An AirTag has no GPS and no cellular radio.
 * It reports a position only when someone else's Apple device passes close
 * enough to hear it over Bluetooth, and Apple's own guidance is that AirTag is
 * for items rather than pets. So this page sells the *holder* — a pocket that
 * keeps the tracker on the dog — and never promises that the dog can be found.
 * The distinction is not pedantry: "always know where your dog is" would be
 * false, would refund, and is the sort of claim ad review rejects.
 */
export const meta: Route.MetaFunction = ({data}) => {
  const image = data?.product?.featuredImage?.url;

  return [
    {title: TITLE},
    {name: 'description', content: DESCRIPTION},
    {name: 'robots', content: 'noindex, nofollow'},
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

export const handle = LANDING_CHROME;

/** Every claim here is in the product's own description. */
const AIRTAG_PILLARS: readonly Pillar[] = [
  {
    title: 'Riveted, not clipped',
    copy: 'The pocket is part of the strap and closed with heavy-duty rivets. There is no split ring to work open and no silicone loop to perish in the sun.',
  },
  {
    title: 'Flush against the neck',
    copy: 'It sits on the collar rather than hanging below it, so there is nothing swinging loose to catch on a crate door, a fence, or another dog.',
  },
  {
    title: 'Hardware for the pull',
    copy: 'Solid alloy buckle and a reinforced leash ring, specified for pull-force resistance and weather exposure — not a thin welded loop.',
  },
];

const AIRTAG_FAQS: readonly Faq[] = [
  {
    question: 'Does it come with an AirTag?',
    answer:
      'No. The pocket is moulded to fit an Apple AirTag and the tracker is bought separately — from Apple, or anywhere that sells them.',
  },
  {
    // The answer that loses a sale rather than earning a refund. An AirTag is
    // not a pet GPS tracker and this page must not let anyone believe it is.
    question: 'Will this let me track my dog anywhere?',
    answer:
      'Not the way a GPS collar would, and it is worth being straight about that. An AirTag has no GPS and no SIM — it reports where it is when an Apple device happens to pass near it, through Apple’s Find My network. In a busy street that happens constantly; on an empty hillside it may not happen at all. Apple designs AirTag for belongings rather than pets. This collar is a better way to carry one, not a substitute for a GPS tracker.',
  },
  {
    question: 'Will the AirTag stay in the pocket?',
    answer:
      'That is the whole point of the design. The pocket is moulded to the shape of the tag and riveted to the strap rather than clipped on, so it holds through the running, rolling and swimming that works a keyring holder loose.',
  },
  {
    question: 'Which size do I order?',
    answer:
      'Measure around the base of the neck and leave two fingers of slack under the tape, then read the chart above. Between two sizes, take the larger — the leather gives as it breaks in.',
  },
  {
    question: 'Is it real leather, and how do I look after it?',
    answer:
      '100% first-layer genuine leather — the top grain of the hide, not bonded offcuts. Wipe it with a damp cloth when it gets muddy and work in a little leather conditioner every few months.',
  },
  {
    question: 'What about delivery and returns?',
    answer: (
      <>
        Delivery times, returns and refunds are all set out in our{' '}
        <Link to="/policies" prefetch="intent" className={FAQ_LINK}>
          store policies
        </Link>
        . Checkout is handled by Shopify, so card details never touch this site.
      </>
    ),
  },
];

export async function loader({context}: Route.LoaderArgs) {
  const {storefront} = context;

  let product: AirtagLandingProductQuery['product'] = null;

  try {
    const data: AirtagLandingProductQuery = await storefront.query(
      AIRTAG_LANDING_PRODUCT_QUERY,
      {variables: {handle: LEATHER_HERO_HANDLE}},
    );
    product = data.product;
  } catch (error) {
    console.error(error);
  }

  // Nothing on this page works without the product, and a paid click must not
  // land on a broken shell — send it somewhere that still sells.
  if (!product) {
    throw new Response(null, {status: 302, headers: {Location: '/shop'}});
  }

  return {product};
}

export default function AirtagCollarLandingPage() {
  const {product} = useLoaderData<typeof loader>();
  const images = product.images.nodes;
  const variant = product.selectedOrFirstAvailableVariant;

  return (
    <div className="bg-[#faf4ec]">
      <AirtagHero
        product={product}
        imageAlt="A yellow Labrador seen from behind on a grass verge, wearing a tan leather collar with a round AirTag pocket riveted into the strap and a leash clipped to the ring."
      />
      <LandingStickyCta
        heroId={AIRTAG_HERO_ID}
        quietSectionIds={AIRTAG_CTA_SECTION_IDS}
        href={AIRTAG_CHOOSER_HREF}
        label="Pick a size"
        price={product.priceRange.minVariantPrice}
      />

      <LandingPillars
        id="airtag"
        eyebrow="Why this one"
        heading="The holder is the part that usually fails."
        pillars={AIRTAG_PILLARS}
      />

      <ProductSpotlight
        product={product}
        tone="sand"
        eyebrow="The strap"
        heading="Leather that softens instead of cracking."
        copy="The tracker is only half of it. The rest is a collar your dog wears every day, so it is cut from the strong part of the hide and finished to sit flat against the neck."
        points={[
          '100% first-layer genuine leather — the top grain, not bonded scrap.',
          'Smooth, bevel-edged interior lining so it does not chafe or wear the fur.',
          'Softens to the shape of your dog over the first few weeks.',
          'Wipes clean; a little conditioner every few months keeps it supple.',
        ]}
        ctaLabel="See it on the product page"
        // Second shot rather than the featured one — the hero is already
        // showing that photo a screen further up.
        image={images[1]}
        imageAlt="An army green leather collar photographed against white, showing the moulded AirTag pocket riveted into the strap beside the alloy buckle."
      />

      <AirtagChooser
        handle={product.handle}
        colourImage={images[2]}
        colourImageAlt="Three of the collars held in one hand — black, orange and army green — each showing the round AirTag pocket and the leash ring below it."
      />

      <LandingFaq id="airtag" faqs={AIRTAG_FAQS} tone="sand" />

      <LandingFinalCta
        id={AIRTAG_FINAL_CTA_ID}
        heading="Put the tracker where it stays."
        copy="Genuine leather, alloy hardware, and a pocket riveted into the strap so the AirTag is still there when you need it. Three colours, three sizes."
        ctaHref={AIRTAG_CHOOSER_HREF}
        ctaLabel="Pick a colour and size"
        secondaryHref="/lp/leather"
        secondaryLabel="Or see the rest of the leather range"
      />

      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: product.priceRange.minVariantPrice.amount,
              vendor: product.vendor,
              variantId: variant?.id ?? '',
              // The fragment carries the variant's options but not its title;
              // joining the values rebuilds Shopify's own format ("Black / M").
              variantTitle:
                variant?.selectedOptions
                  .map((option) => option.value)
                  .join(' / ') ?? '',
              quantity: 1,
            },
          ],
        }}
      />
    </div>
  );
}

const AIRTAG_LANDING_PRODUCT_QUERY = `#graphql
  query AirtagLandingProduct(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...RecommendedProduct
      # Not in the shared fragment, but Analytics.ProductView refuses to
      # register the event at all without it.
      vendor
      # The spotlight and the colour section each need a shot of their own, so
      # the hero's featured image isn't repeated twice further down the page.
      images(first: 4) {
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
  ${RECOMMENDED_PRODUCT_FRAGMENT}
` as const;
