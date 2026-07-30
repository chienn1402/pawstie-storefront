import {Link} from 'react-router';
import {LandingCta} from '~/components/landing/LandingCta';

/**
 * The close. The primary CTA should point back at whatever this page is selling
 * — the on-page grid, or the product itself — rather than off to `/shop`:
 * anyone who has read this far has already chosen a lane, and the catalogue
 * would drop them into a mixed grid to filter themselves. The secondary link
 * stays as a quiet second option for the people it suits.
 */
export function LandingFinalCta({
  id,
  heading,
  copy,
  ctaHref,
  ctaLabel,
  secondaryHref,
  secondaryLabel,
}: {
  id: string;
  heading: string;
  copy: string;
  ctaHref: string;
  ctaLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  const headingId = `${id}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="relative isolate -mx-4 w-[calc(100%+2rem)] overflow-hidden bg-[#241610] px-6 py-20 text-center lg:px-[7vw] lg:py-28"
    >
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 -z-10 size-[36rem] -translate-x-1/2 -translate-y-1/2 lg:size-[52rem]"
        style={{
          background:
            'radial-gradient(closest-side,rgba(169,83,14,.35),rgba(169,83,14,0))',
        }}
      />

      <div className="mx-auto max-w-[46rem]">
        <h2
          id={headingId}
          className="mx-auto mb-0 max-w-[16ch] text-balance font-heading text-4xl font-semibold leading-[0.94] tracking-[-0.055em] text-[#faf4ec] sm:text-5xl lg:text-6xl"
        >
          {heading}
        </h2>
        <p className="mx-auto mt-6 max-w-[34rem] text-lg leading-relaxed text-[#cbae90]">
          {copy}
        </p>

        <div className="mt-10 flex flex-col items-center gap-6">
          <LandingCta href={ctaHref} tone="cream">
            {ctaLabel}
          </LandingCta>

          {secondaryHref && secondaryLabel ? (
            <Link
              to={secondaryHref}
              prefetch="intent"
              className="font-heading text-base font-semibold text-[#cbae90] underline decoration-[#7a5636] decoration-2 underline-offset-[6px] transition-colors hover:text-[#faf4ec] hover:decoration-[#cbae90] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e0a668]"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
