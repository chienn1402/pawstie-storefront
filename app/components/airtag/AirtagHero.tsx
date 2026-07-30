import {Image, Money} from '@shopify/hydrogen';
import {Link} from 'react-router';
import type {RecommendedProductFragment} from 'storefrontapi.generated';
import {BoltIcon, PawIcon, ShieldCheckIcon} from '~/components/icons';
import {LandingCta} from '~/components/landing/LandingCta';
import {
  AIRTAG_CHOOSER_HREF,
  AIRTAG_HERO_ID,
} from '~/components/airtag/anchors';

// React 18 drops the camelCase `fetchPriority` prop, so pass the DOM spelling.
// This photo is the page's LCP element and every visitor arrives cold from an
// ad, so it must not wait behind lazy-loading heuristics.
const HERO_IMAGE_PRIORITY = {fetchpriority: 'high'} as const;

/**
 * "Tracker sold separately" leads the assurance row rather than hiding in the
 * FAQ. It is the single biggest refund driver on this product, and a visitor
 * who discovers it at checkout is a chargeback rather than a customer.
 */
const HERO_ASSURANCES: ReadonlyArray<{
  Icon: typeof PawIcon;
  title: string;
  copy: string;
}> = [
  {
    Icon: BoltIcon,
    title: 'Fits Apple AirTag',
    copy: 'tracker sold separately',
  },
  {
    Icon: PawIcon,
    title: 'First-layer leather',
    copy: 'the top grain, not bonded scrap',
  },
  {
    Icon: ShieldCheckIcon,
    title: 'Secure checkout',
    copy: 'payments handled by Shopify',
  },
];

export function AirtagHero({
  product,
  imageAlt,
}: {
  product: RecommendedProductFragment;
  imageAlt: string;
}) {
  const image = product.featuredImage;

  return (
    <section
      id={AIRTAG_HERO_ID}
      aria-labelledby="airtag-hero-heading"
      // Full-bleed past the 1rem margin `reset.css` puts on `body > main`.
      className="relative isolate -mx-4 w-[calc(100%+2rem)] overflow-hidden bg-[#241610] px-6 pb-14 pt-24 lg:px-[7vw] lg:pb-20 lg:pt-32"
    >
      <span
        aria-hidden="true"
        className="absolute -right-24 top-4 -z-10 size-[30rem] lg:right-[4vw] lg:size-[46rem]"
        style={{
          background:
            'radial-gradient(closest-side,rgba(169,83,14,.42),rgba(169,83,14,0))',
        }}
      />

      <div className="mx-auto max-w-[80rem]">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_minmax(0,27rem)] lg:items-center lg:gap-x-16">
          <div className="min-w-0 lg:col-start-1 lg:row-start-1">
            <p className="font-heading text-sm font-bold uppercase tracking-[0.18em] text-[#e0a668]">
              The Signature AirTag Collar
            </p>

            <h1
              id="airtag-hero-heading"
              className="mb-0 mt-4 max-w-[14ch] text-balance font-heading text-[clamp(2.6rem,8.5vw,4.2rem)] font-semibold leading-[0.9] tracking-[-0.055em] text-[#faf4ec] lg:text-[clamp(3rem,4.6vw,4.8rem)]"
            >
              Riveted on, not clipped on.
            </h1>

            <p className="mt-6 max-w-[36rem] text-lg leading-relaxed text-[#cbae90]">
              The AirTag sits in a moulded pocket built into the strap and
              closed with heavy-duty rivets — flush against the neck, with no
              keyring to catch on a fence and nothing dangling to work loose.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
              <LandingCta href={AIRTAG_CHOOSER_HREF}>
                Pick a colour and size
              </LandingCta>

              <p className="mb-0 font-heading text-sm font-semibold text-[#cbae90]">
                <Money
                  as="span"
                  data={product.priceRange.minVariantPrice}
                  className="text-[#faf4ec]"
                />{' '}
                · three colours, three sizes
              </p>
            </div>
          </div>

          {image ? (
            <div className="mx-auto w-full min-w-0 max-w-[24rem] lg:col-start-2 lg:row-start-1 lg:mx-0 lg:max-w-none">
              <Link
                to={`/products/${product.handle}`}
                prefetch="intent"
                className="block overflow-hidden rounded-[2rem] bg-[#3a2519] ring-1 ring-[#4d3423] lg:rounded-[2.75rem]"
              >
                <Image
                  alt={imageAlt}
                  aspectRatio="4/5"
                  data={image}
                  loading="eager"
                  sizes="(min-width: 64em) 27rem, min(100vw - 3rem, 24rem)"
                  className="size-full rounded-none! object-cover"
                  {...HERO_IMAGE_PRIORITY}
                />
              </Link>
            </div>
          ) : null}

          <ul className="grid gap-4 border-t border-[#4a3325] pt-8 sm:grid-cols-3 sm:gap-x-6 lg:col-span-2 lg:col-start-1 lg:row-start-2 lg:mt-6">
            {HERO_ASSURANCES.map(({Icon, title, copy}) => (
              <li key={title} className="mb-0 flex items-center gap-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#33200f] text-[#e0a668] ring-1 ring-[#5b3d27]">
                  <Icon className="size-[1.15rem]" />
                </span>
                <p className="mb-0 min-w-0 text-[0.9375rem] leading-snug text-[#cbae90]">
                  <strong className="block font-heading font-semibold text-[#faf4ec]">
                    {title}
                  </strong>
                  {copy}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
