import {Link} from 'react-router';
import {
  LeatherCta,
  LEATHER_COLLECTION_HREF,
  LEATHER_FINAL_CTA_ID,
} from '~/components/leather/LeatherCta';

/**
 * The close. Sends visitors back up to the grid rather than off to `/shop` —
 * anyone who has read this far is shopping leather, and the catalogue page
 * would drop them back into a mixed grid they'd have to filter themselves.
 * The `/shop` link stays as a quiet second option for the people it suits.
 */
export function LeatherFinalCta() {
  return (
    <section
      id={LEATHER_FINAL_CTA_ID}
      aria-labelledby="leather-final-heading"
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
          id="leather-final-heading"
          className="mx-auto mb-0 max-w-[16ch] text-balance font-heading text-4xl font-semibold leading-[0.94] tracking-[-0.055em] text-[#faf4ec] sm:text-5xl lg:text-6xl"
        >
          Buy the collar once.
        </h2>
        <p className="mx-auto mt-6 max-w-[34rem] text-lg leading-relaxed text-[#cbae90]">
          Genuine leather, alloy hardware, engraving included on the nameplate
          collars. It should outlast every nylon one you&rsquo;ve replaced.
        </p>

        <div className="mt-10 flex flex-col items-center gap-6">
          <LeatherCta href={LEATHER_COLLECTION_HREF} tone="cream">
            Shop the leather range
          </LeatherCta>

          <Link
            to="/shop"
            prefetch="intent"
            className="font-heading text-base font-semibold text-[#cbae90] underline decoration-[#7a5636] decoration-2 underline-offset-[6px] transition-colors hover:text-[#faf4ec] hover:decoration-[#cbae90] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e0a668]"
          >
            Or see everything else in the shop
          </Link>
        </div>
      </div>
    </section>
  );
}
