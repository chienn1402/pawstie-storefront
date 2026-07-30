import {Image, Money} from '@shopify/hydrogen';
import {Link} from 'react-router';
import type {RecommendedProductFragment} from 'storefrontapi.generated';
import {PawIcon, ShieldCheckIcon, StarIcon} from '~/components/icons';
import {
  LeatherCta,
  LEATHER_COLLECTION_HREF,
  LEATHER_HERO_ID,
} from '~/components/leather/LeatherCta';

// React 18 drops the camelCase `fetchPriority` prop, so pass the DOM spelling.
// This photo is the page's LCP element and every visitor arrives cold from an
// ad, so it must not wait behind lazy-loading heuristics.
const HERO_IMAGE_PRIORITY = {fetchpriority: 'high'} as const;

/**
 * Claims taken from the product descriptions, not invented for the ad. Nothing
 * here promises a delivery window or quotes a review count — the shop has no
 * review source, and a shipping promise on a landing page is a promise the
 * fulfilment side then has to keep.
 */
const HERO_ASSURANCES: ReadonlyArray<{
  Icon: typeof PawIcon;
  title: string;
  copy: string;
}> = [
  {
    Icon: PawIcon,
    title: 'First-layer leather',
    copy: 'the top grain, not bonded scrap',
  },
  {
    Icon: StarIcon,
    title: 'Free engraving',
    copy: 'on every nameplate collar',
  },
  {
    Icon: ShieldCheckIcon,
    title: 'Secure checkout',
    copy: 'payments handled by Shopify',
  },
];

export function LeatherHero({
  heroProduct,
  fromPrice,
  imageAlt,
}: {
  heroProduct: RecommendedProductFragment | null;
  fromPrice: RecommendedProductFragment['priceRange']['minVariantPrice'] | null;
  /**
   * Written alt for the hero shot. The store's product media carries content
   * hashes as its `altText` ("f7a2363d7b6d..."), which is worse than nothing
   * read aloud, so this editorial slot takes a real description instead. Null
   * when the hero has fallen back to a product this page can't describe.
   */
  imageAlt: string | null;
}) {
  const image = heroProduct?.featuredImage;

  return (
    <section
      id={LEATHER_HERO_ID}
      aria-labelledby="leather-hero-heading"
      // Full-bleed past the 1rem margin `reset.css` puts on `body > main`.
      className="relative isolate -mx-4 w-[calc(100%+2rem)] overflow-hidden bg-[#241610] px-6 pb-14 pt-24 lg:px-[7vw] lg:pb-20 lg:pt-32"
    >
      {/* A low warm glow behind the product so the cut-out doesn't sit on flat
          black. Radial rather than a solid disc — a hard arc on an otherwise
          unlit background reads as a rendering mistake. */}
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
          {/* ── Copy. First on mobile, and the CTA sits above the image so the
                fold still carries a button on a 667px phone. ─────────────── */}
          <div className="min-w-0 lg:col-start-1 lg:row-start-1">
            <p className="font-heading text-sm font-bold uppercase tracking-[0.18em] text-[#e0a668]">
              The leather collection
            </p>

            <h1
              id="leather-hero-heading"
              className="mb-0 mt-4 max-w-[15ch] text-balance font-heading text-[clamp(2.6rem,8.5vw,4.2rem)] font-semibold leading-[0.9] tracking-[-0.055em] text-[#faf4ec] lg:text-[clamp(3rem,4.6vw,4.8rem)]"
            >
              Leather that looks better the more it&rsquo;s worn.
            </h1>

            <p className="mt-6 max-w-[36rem] text-lg leading-relaxed text-[#cbae90]">
              Collars and leashes cut from 100% first-layer genuine leather,
              with solid alloy hardware and edges that won&rsquo;t chafe.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
              <LeatherCta href={LEATHER_COLLECTION_HREF}>
                Shop the leather range
              </LeatherCta>

              {fromPrice ? (
                <p className="mb-0 font-heading text-sm font-semibold text-[#cbae90]">
                  From{' '}
                  <Money
                    as="span"
                    data={fromPrice}
                    className="text-[#faf4ec]"
                  />
                </p>
              ) : null}
            </div>
          </div>

          {/* ── Product shot ─────────────────────────────────────────────── */}
          {image ? (
            <div className="mx-auto w-full min-w-0 max-w-[24rem] lg:col-start-2 lg:row-start-1 lg:mx-0 lg:max-w-none">
              <Link
                to={`/products/${heroProduct.handle}`}
                prefetch="intent"
                className="block overflow-hidden rounded-[2rem] bg-[#3a2519] ring-1 ring-[#4d3423] lg:rounded-[2.75rem]"
              >
                <Image
                  alt={imageAlt || heroProduct.title}
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

          {/* ── What you actually get. Below the fold on purpose: it answers
                the objections that follow the click, not the hook. ───────── */}
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
