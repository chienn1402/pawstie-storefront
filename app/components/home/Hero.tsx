import {useId, useState} from 'react';
import {Link} from 'react-router';
import engravedCollar from '~/assets/hero-engraved-collar.jpg';
import {
  ArrowRightIcon,
  PawIcon,
  ShieldCheckIcon,
  StarIcon,
} from '~/components/icons';

/** The nameplate style the hero previews — the collar people land on to buy. */
const NAMEPLATE_COLLAR_HREF = '/products/the-heritage-nameplate-leather-collar';
const SHOP_HREF = '/shop';

// React 18 drops the camelCase `fetchPriority` prop, so pass the DOM spelling.
const HERO_IMAGE_PRIORITY = {fetchpriority: 'high'} as const;

/**
 * Real facts only — no invented review counts, no customer totals, and nothing
 * about shipping. Anything the hero says about delivery or tracking reads as a
 * promise the shop then has to keep, so it says nothing at all.
 *
 * Keep these category-agnostic too — the catalogue is still growing, so nothing
 * here should tie the shop to one kind of product.
 *
 * `copy` is optional on purpose: only the engraving line needs a qualifier,
 * because most products have no nameplate and an unqualified "free engraving"
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
    copy: 'on every piece made for a nameplate',
  },
  {Icon: ShieldCheckIcon, title: 'Secure Shopify checkout'},
];

/**
 * A solid-brass nameplate, the way it sits on the collar in the product photos:
 * a warm metal gradient, a rivet at each end, and text pressed into the surface
 * with a light bottom edge. Purely visual — the input beside it owns the value.
 */
function Nameplate({name}: {name: string}) {
  const engraved = name.trim() || 'Their name';

  // Long names step down a size so the plate never has to grow.
  const nameSize =
    engraved.length <= 6
      ? 'text-[1.65rem]'
      : engraved.length <= 10
        ? 'text-[1.3rem]'
        : engraved.length <= 14
          ? 'text-[1.05rem]'
          : 'text-[0.9rem]';

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none inline-flex -rotate-[4deg] select-none items-center gap-3 rounded-[0.7rem] border border-[#8a6318]/60 px-3.5 py-2.5 sm:gap-4 sm:px-4"
      style={{
        background:
          'linear-gradient(153deg,#fdf1cd 0%,#eac979 17%,#cb9c3e 44%,#e6c273 60%,#b8862b 84%,#dcb257 100%)',
        boxShadow:
          '0 14px 30px -10px rgba(46,28,0,.55), inset 0 1px 0 rgba(255,255,255,.7), inset 0 -1px 0 rgba(110,76,12,.55)',
      }}
    >
      <Rivet />
      <span className="flex flex-col items-center leading-none">
        <span
          className={`font-heading font-semibold tracking-[-0.01em] text-[#5d3d04] ${nameSize}`}
          style={{textShadow: '0 1px 0 rgba(255,255,255,.5)'}}
        >
          {engraved}
        </span>
        <span
          className="mt-1.5 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[#7a5410] sm:text-[0.65rem]"
          style={{textShadow: '0 1px 0 rgba(255,255,255,.45)'}}
        >
          + your phone number
        </span>
      </span>
      <Rivet />
    </span>
  );
}

function Rivet() {
  return (
    <span
      className="size-2 shrink-0 rounded-full"
      style={{
        background:
          'radial-gradient(circle at 35% 30%,#fbe9bb 0%,#b98c30 55%,#7c5310 100%)',
        boxShadow: 'inset 0 1px 1.5px rgba(48,30,0,.7)',
      }}
    />
  );
}

export function Hero() {
  const [name, setName] = useState('Cooper');
  const fieldId = useId();

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
        <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,23rem)] lg:gap-x-12 lg:gap-y-10 xl:grid-cols-[1.05fr_minmax(0,28rem)] xl:gap-x-20">
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

            <Link
              to={SHOP_HREF}
              prefetch="intent"
              className="group mt-9 inline-flex min-h-16 items-center gap-5 rounded-full bg-primary py-2 pl-8 pr-2 font-heading text-lg font-semibold text-white shadow-[0_12px_28px_-10px_rgba(169,83,14,0.5)] transition-[transform,box-shadow,background-color] duration-300 hover:-translate-y-0.5 hover:bg-[#8f440b] hover:no-underline hover:shadow-[0_20px_38px_-12px_rgba(169,83,14,0.65)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00521d] motion-reduce:transition-none motion-reduce:hover:translate-y-0 lg:text-xl"
            >
              Shop the collection
              <span className="relative grid size-12 place-items-center overflow-hidden rounded-full bg-white text-primary">
                <ArrowRightIcon className="size-5 transition-transform duration-300 motion-safe:group-hover:translate-x-[220%]" />
                <ArrowRightIcon className="absolute size-5 -translate-x-[220%] transition-transform duration-300 motion-safe:group-hover:translate-x-0" />
              </span>
            </Link>
          </div>

          {/* ── Photo stage + live engraving preview ─────────────────── */}
          {/* Capped while stacked — a 4/5 photo at full tablet width is a
              screen and a half tall. */}
          <div className="mx-auto w-full min-w-0 max-w-[27rem] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mx-0 lg:max-w-none lg:self-center">
            <div className="group relative">
              <div className="relative overflow-hidden rounded-[2rem] bg-[#a4e8aa] lg:rounded-[2.75rem]">
                <img
                  src={engravedCollar}
                  alt="A golden retriever wearing a braided leather Pawstie collar with an engraved brass nameplate."
                  width="750"
                  height="1000"
                  {...HERO_IMAGE_PRIORITY}
                  decoding="async"
                  className="aspect-[4/5] size-full rounded-none! object-cover object-[50%_35%] transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.03] motion-reduce:transition-none"
                />
                {/* Keeps the plate legible over the busy lower third. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 via-black/12 to-transparent"
                />
              </div>

              <span className="absolute bottom-5 left-5 lg:bottom-7 lg:left-7">
                <Nameplate name={name} />
              </span>
            </div>

            {/* The toy: type a name, watch the plate change, then go buy it. */}
            <div className="mt-4 rounded-[1.5rem] bg-white p-4 shadow-[0_10px_30px_-18px_rgba(0,72,23,0.45)] ring-1 ring-[#cdebc5] sm:p-5 lg:mt-5">
              <label
                className="block font-heading text-xs font-bold uppercase tracking-[0.16em] text-[#347345]"
                htmlFor={`${fieldId}-name`}
              >
                Type their name
              </label>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <input
                  autoComplete="off"
                  autoCapitalize="words"
                  className="m-0 min-h-13 min-w-0 flex-1 rounded-full border border-[#cdebc5] bg-[#f6fdf2] px-5 py-2 font-heading text-lg font-semibold text-[#004817] outline-none transition-colors placeholder:font-normal placeholder:text-[#7fa287] focus:border-[#00521d] focus-visible:ring-2 focus-visible:ring-[#00521d]/25"
                  id={`${fieldId}-name`}
                  maxLength={18}
                  onChange={(event) => setName(event.currentTarget.value)}
                  placeholder="Cooper"
                  type="text"
                  value={name}
                />

                <Link
                  to={NAMEPLATE_COLLAR_HREF}
                  prefetch="intent"
                  className="group/cta inline-flex min-h-13 shrink-0 items-center gap-3 rounded-full bg-[#00521d] px-6 font-heading text-base font-semibold text-white transition-[transform,background-color] duration-300 hover:-translate-y-0.5 hover:bg-[#006523] hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#00521d] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  Engrave it
                  <ArrowRightIcon className="size-4 transition-transform duration-300 motion-safe:group-hover/cta:translate-x-1" />
                </Link>
              </div>

              <p className="mt-3 text-sm leading-snug text-[#4d6b55]">
                Preview only — the real details go on the product page.
              </p>
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
