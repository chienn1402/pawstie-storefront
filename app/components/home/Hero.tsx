import {Link} from 'react-router';
// Photo: belen capello via Pexels (pexels.com/photo/7527370). The Pexels
// License covers commercial use and modification with no attribution required —
// the credit is here so nobody has to go looking for the provenance later.
// Cropped to 3:4 and downsized locally; bundled rather than hotlinked so the
// hero can't break when a CDN URL changes.
import heroPet from '~/assets/hero-pets.jpg';
import heroPet375 from '~/assets/hero-pets-375.jpg';
import heroPet500 from '~/assets/hero-pets-500.jpg';
import {
  ArrowRightIcon,
  PawIcon,
  ShieldCheckIcon,
  StarIcon,
} from '~/components/icons';

const SHOP_HREF = '/shop';
const ABOUT_HREF = '/about';

// React 18 drops the camelCase `fetchPriority` prop, so pass the DOM spelling.
const HERO_IMAGE_PRIORITY = {fetchpriority: 'high'} as const;

/**
 * This photo is the page's LCP element, so it should never ship more bytes than
 * the slot can use. The column caps at 29rem (464px), which a 750w source
 * already covers at 2x — so 750w is the largest useful variant, and phones take
 * 375w instead of the full-size file for a ~327px slot.
 *
 * `sizes` mirrors the grid below exactly: 29rem from xl, 24rem from lg, and the
 * capped column width while stacked (viewport minus the section's 1.5rem
 * gutters, never past the 25rem cap).
 */
const HERO_IMAGE_SRCSET = `${heroPet375} 375w, ${heroPet500} 500w, ${heroPet} 750w`;
const HERO_IMAGE_SIZES =
  '(min-width: 1280px) 29rem, (min-width: 1024px) 24rem, min(100vw - 3rem, 25rem)';

/**
 * Real facts only — no invented review counts, no customer totals, and nothing
 * about shipping. Anything the hero says about delivery or tracking reads as a
 * promise the shop then has to keep, so it says nothing at all.
 *
 * Shop-level facts only, too. Nothing here names a product, a handle, or a
 * category: the hero has to keep working as the catalogue grows, and anything
 * that sells one item belongs on that item's own page instead of being said
 * twice.
 *
 * `copy` is optional on purpose: only the engraving line needs a qualifier,
 * because most products aren't personalised and an unqualified "free engraving"
 * would over-claim. The other two say everything in the title.
 */
const HERO_ASSURANCES: ReadonlyArray<{
  Icon: typeof PawIcon;
  title: string;
  copy?: string;
}> = [
  {Icon: PawIcon, title: 'Picked, not stocked'},
  {
    Icon: StarIcon,
    title: 'Free engraving',
    copy: 'on every personalised piece',
  },
  {Icon: ShieldCheckIcon, title: 'Secure Shopify checkout'},
];

export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate -mx-4 w-[calc(100%+2rem)] overflow-hidden bg-[#effce9] px-6 pb-12 pt-28 lg:px-[7vw] lg:pb-16 lg:pt-36"
    >
      {/* Echoes the orange disc in Shop By Routine, dialled all the way down.
          A radial gradient rather than a solid circle — a hard arc across the
          empty half of the hero reads as a mistake. */}
      <span
        aria-hidden="true"
        className="absolute -right-32 -top-40 -z-10 size-[34rem] lg:size-[52rem]"
        style={{
          background:
            'radial-gradient(closest-side,rgba(164,232,170,.85),rgba(164,232,170,0))',
        }}
      />

      <div className="mx-auto max-w-[80rem]">
        <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,24rem)] lg:gap-x-12 lg:gap-y-10 xl:grid-cols-[1.05fr_minmax(0,29rem)] xl:gap-x-20">
          {/* ── Copy ─────────────────────────────────────────────────── */}
          <div className="min-w-0 lg:col-start-1 lg:row-start-1 lg:self-end">
            <p className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-primary">
              For very good animals
            </p>

            <h1
              id="hero-heading"
              className="mb-0 mt-4 max-w-[14ch] text-balance font-heading text-[clamp(2.7rem,6.2vw,4.4rem)] font-semibold leading-[0.88] tracking-[-0.06em] text-[#004817] lg:text-[clamp(2.9rem,4.7vw,4.9rem)]"
            >
              Everything your pets love.
            </h1>

            <p className="mt-7 max-w-[34rem] text-lg leading-relaxed text-[#347345]">
              A small, carefully picked shelf for dogs and cats — the useful,
              comfortable, well-made things worth keeping.
            </p>

            {/* One destination, the whole catalogue. The hero deliberately
                sends nobody to a single product: each product now gets its own
                page to make its own case. */}
            <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-5">
              <Link
                to={SHOP_HREF}
                prefetch="intent"
                className="group inline-flex min-h-16 items-center gap-5 rounded-full bg-primary py-2 pl-8 pr-2 font-heading text-lg font-semibold text-white shadow-[0_12px_28px_-10px_rgba(169,83,14,0.5)] transition-[transform,box-shadow,background-color] duration-300 hover:-translate-y-0.5 hover:bg-[#8f440b] hover:no-underline hover:shadow-[0_20px_38px_-12px_rgba(169,83,14,0.65)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00521d] motion-reduce:transition-none motion-reduce:hover:translate-y-0 lg:text-xl"
              >
                Shop the collection
                <span className="relative grid size-12 place-items-center overflow-hidden rounded-full bg-white text-primary">
                  <ArrowRightIcon className="size-5 transition-transform duration-300 motion-safe:group-hover:translate-x-[220%]" />
                  <ArrowRightIcon className="absolute size-5 -translate-x-[220%] transition-transform duration-300 motion-safe:group-hover:translate-x-0" />
                </span>
              </Link>

              <Link
                to={ABOUT_HREF}
                prefetch="intent"
                className="font-heading text-base font-semibold text-[#00521d] underline decoration-[#9fd2a8] decoration-2 underline-offset-[6px] transition-colors hover:decoration-[#00521d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00521d] lg:text-lg"
              >
                Read our story
              </Link>
            </div>
          </div>

          {/* ── Photo stage ──────────────────────────────────────────── */}
          {/* Capped while stacked — a 3/4 photo at full tablet width is a
              screen and a half tall. */}
          <div className="mx-auto w-full min-w-0 max-w-[25rem] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mx-0 lg:max-w-none lg:self-center">
            <div className="overflow-hidden rounded-[2rem] bg-[#a4e8aa] lg:rounded-[2.75rem]">
              <img
                src={heroPet}
                srcSet={HERO_IMAGE_SRCSET}
                sizes={HERO_IMAGE_SIZES}
                alt="A cream Labrador leaning down to greet a small grey kitten on a wooden living room floor."
                width="750"
                height="1000"
                {...HERO_IMAGE_PRIORITY}
                decoding="async"
                className="aspect-[3/4] size-full rounded-none! object-cover object-center"
              />
            </div>
          </div>

          {/* ── What you actually get. Last on mobile, under the copy on
                desktop, so the left column doesn't empty out. ─────────── */}
          <ul className="grid gap-4 border-t border-[#bfe9bb] pt-7 sm:grid-cols-2 sm:gap-x-8 lg:col-start-1 lg:row-start-2 lg:grid-cols-1 lg:gap-4 lg:self-start">
            {HERO_ASSURANCES.map(({Icon, title, copy}) => (
              <li key={title} className="mb-0 flex items-center gap-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#00752d] ring-1 ring-[#cdebc5]">
                  <Icon className="size-[1.15rem]" />
                </span>
                <p className="min-w-0 text-[0.9375rem] leading-snug text-[#347345]">
                  <strong className="font-heading font-semibold text-[#004817]">
                    {title}
                  </strong>
                  {copy ? ` — ${copy}` : null}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
