import {Image, Money} from '@shopify/hydrogen';
import {Link} from 'react-router';
import type {RecommendedProductFragment} from 'storefrontapi.generated';
import {ArrowRightIcon} from '~/components/icons';
import {cn} from '~/lib/utils';

/**
 * A single product argued at length: photo on one side, the four things worth
 * knowing on the other. Used twice on the landing page — once for the AirTag
 * collar, once mirrored for the engraved nameplate collar — because a cold
 * visitor needs one product made concrete before a grid of six means anything.
 *
 * `footnote` exists for the disclaimers that belong next to the claim rather
 * than buried on the PDP (the AirTag itself isn't in the box, engraving is
 * permanent). Cold traffic that finds those out at checkout refunds.
 */
export function LeatherSpotlight({
  product,
  eyebrow,
  heading,
  copy,
  points,
  ctaLabel,
  footnote,
  image: imageOverride,
  imageAlt,
  reverse = false,
  tone = 'cream',
}: {
  product: RecommendedProductFragment;
  /** Alternate shot, so a spotlight can avoid repeating the hero's photo. */
  image?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  eyebrow: string;
  heading: React.ReactNode;
  copy: string;
  points: readonly string[];
  ctaLabel: string;
  footnote?: string;
  /**
   * Written alt. The store's product media has content hashes for `altText`,
   * so these editorial slots describe the shot themselves rather than reading
   * "4dbf2f64ae96" to a screen reader.
   */
  imageAlt?: string;
  reverse?: boolean;
  tone?: 'cream' | 'sand';
}) {
  const image = imageOverride ?? product.featuredImage;
  const href = `/products/${product.handle}`;

  return (
    <section
      aria-labelledby={`leather-spotlight-${product.handle}`}
      className={cn(
        '-mx-4 w-[calc(100%+2rem)] px-6 py-20 lg:px-[7vw] lg:py-28',
        tone === 'cream' ? 'bg-[#faf4ec]' : 'bg-[#f0e3d1]',
      )}
    >
      <div className="mx-auto max-w-[80rem]">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          {image ? (
            <div
              className={cn(
                'mx-auto w-full min-w-0 max-w-[26rem] lg:mx-0 lg:max-w-none',
                reverse ? 'lg:order-2' : 'lg:order-1',
              )}
            >
              <Link
                to={href}
                prefetch="intent"
                className="block overflow-hidden rounded-[1.75rem] bg-[#e6d6c0] lg:rounded-[2.25rem]"
              >
                <Image
                  alt={imageAlt || product.title}
                  aspectRatio="1/1"
                  data={image}
                  loading="lazy"
                  sizes="(min-width: 64em) 40vw, min(100vw - 3rem, 26rem)"
                  className="size-full rounded-none! object-cover"
                />
              </Link>
            </div>
          ) : null}

          <div
            className={cn(
              'min-w-0',
              reverse ? 'lg:order-1' : 'lg:order-2',
              image ? '' : 'lg:col-span-2',
            )}
          >
            <p className="font-heading text-sm font-bold uppercase tracking-[0.18em] text-primary">
              {eyebrow}
            </p>

            <h2
              id={`leather-spotlight-${product.handle}`}
              className="mb-0 mt-4 max-w-[16ch] font-heading text-4xl font-semibold leading-[0.94] tracking-[-0.05em] text-[#2e1c12] sm:text-5xl"
            >
              {heading}
            </h2>

            <p className="mt-5 max-w-[34rem] text-lg leading-relaxed text-[#6b5340]">
              {copy}
            </p>

            <ul className="mt-8 grid gap-3.5">
              {points.map((point) => (
                <li key={point} className="mb-0 flex gap-3.5">
                  <span
                    aria-hidden="true"
                    className="mt-2 size-2 shrink-0 rounded-full bg-primary"
                  />
                  <span className="min-w-0 leading-relaxed text-[#5b4636]">
                    {point}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link
                to={href}
                prefetch="intent"
                className="group inline-flex min-h-14 items-center gap-4 rounded-full bg-[#2e1c12] py-2 pl-7 pr-2 font-heading text-base font-semibold text-white no-underline! transition-[transform,box-shadow,background-color] duration-300 hover:-translate-y-0.5 hover:bg-[#43291a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                {ctaLabel}
                <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-primary text-white">
                  <ArrowRightIcon className="size-5 transition-transform duration-300 motion-safe:group-hover:translate-x-[220%]" />
                  <ArrowRightIcon className="absolute size-5 -translate-x-[220%] transition-transform duration-300 motion-safe:group-hover:translate-x-0" />
                </span>
              </Link>

              <p className="mb-0 font-heading text-base font-bold text-[#2e1c12]">
                <Money as="span" data={product.priceRange.minVariantPrice} />
              </p>
            </div>

            {footnote ? (
              <p className="mt-5 max-w-[34rem] text-sm leading-relaxed text-[#8a705a]">
                {footnote}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
