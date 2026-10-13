import {useCallback, useEffect, useRef, useState} from 'react';
import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {
  Image as ImageType,
  MoneyV2,
} from '@shopify/hydrogen/storefront-api-types';
// Photo: belen capello via Pexels (pexels.com/photo/7527370). The Pexels
// License covers commercial use and modification with no attribution required.
// Only shown when the Storefront query comes back empty — the hero must never
// render a blank card.
import heroPet from '~/assets/hero-pets.jpg';
import heroPet375 from '~/assets/hero-pets-375.jpg';
import heroPet500 from '~/assets/hero-pets-500.jpg';
import {
  ArrowRightIcon,
  PauseIcon,
  PawIcon,
  PlayIcon,
} from '~/components/icons';
import {
  FALLBACK_ROUTINE,
  maxPercentOff,
  routinesSentence,
  type HeroSlide,
} from '~/lib/hero';
import {cn} from '~/lib/utils';

export type HeroProductSlide = HeroSlide<
  Pick<MoneyV2, 'amount' | 'currencyCode'>,
  Pick<ImageType, 'id' | 'url' | 'altText' | 'width' | 'height'>
>;

const SHOP_HREF = '/shop';

/** Below this, "Up to N% off" undersells more than it sells. */
const MIN_HEADLINE_DISCOUNT = 5;

// React 18 drops the camelCase `fetchPriority` prop, so pass the DOM spelling.
// The first slide is the page's LCP element; the rest are in the DOM but
// off-screen inside the track, which is exactly the case `low` is for.
const LCP_PRIORITY = {fetchpriority: 'high'} as const;
const HIDDEN_PRIORITY = {fetchpriority: 'low'} as const;

/**
 * Mirrors the card's width at every breakpoint: 32rem from xl, 27rem from lg,
 * and the stacked column (viewport minus the 1.5rem gutters, capped at 28rem)
 * below that.
 */
const CARD_SIZES =
  '(min-width: 1280px) 32rem, (min-width: 1024px) 27rem, min(100vw - 3rem, 28rem)';

const FALLBACK_SRCSET = `${heroPet375} 375w, ${heroPet500} 500w, ${heroPet} 750w`;

/**
 * Shop-level facts only, for the scrolling strip. Same rule as everywhere else
 * on this page: no review counts, no customer totals, and nothing about
 * delivery — a shipping line here is a promise fulfilment then has to keep.
 */
const STRIP_FACTS = [
  'Free engraving on personalised pieces',
  'Secure Shopify checkout',
  'Made for dogs & cats',
  'Picked, not stocked',
] as const;

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a4e8aa]';

/**
 * The homepage hero, built for a cold visitor on a phone — which is who paid
 * social sends. The old hero opened on a stock photo and a "small shelf"
 * paragraph: nothing for sale, no price, no reason to tap, and a 94% bounce
 * from TikTok. This one puts the real catalogue in the first screen as a
 * story the visitor already knows how to use: progress bars, swipe, tap
 * through to buy. Whatever product the ad showed turns up within seconds.
 *
 * Every number comes from the Storefront query — prices, compare-at prices,
 * the "Up to N% off" claim — so nothing here can go stale or over-claim.
 */
export function Hero({slides}: {slides: HeroProductSlide[]}) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  // False through SSR and hydration: the first segment must not start filling
  // before React is there to catch its `animationend`.
  const [ready, setReady] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [touching, setTouching] = useState(false);
  // The headline word only animates once it has actually changed, so the
  // first paint isn't an opacity-0 heading waiting on an animation.
  const [wordMotion, setWordMotion] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useRef(false);

  const routine = slides[index]?.routine ?? FALLBACK_ROUTINE;
  const bestDeal = maxPercentOff(slides);
  const onSale = bestDeal >= MIN_HEADLINE_DISCOUNT;
  const autoplay = ready && playing && count > 1;
  const running = autoplay && onScreen && !touching;

  useEffect(() => {
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    reducedMotion.current = reduce;
    // A story that moves on its own is exactly the motion this asks to avoid;
    // the bars and swipe still work, they just wait for the visitor.
    if (reduce) setPlaying(false);
    setReady(true);
  }, []);

  useEffect(() => {
    if (index !== 0) setWordMotion(true);
  }, [index]);

  // Swipes, taps on the bars and autoplay all end the same way — a slide
  // snapping into the track — so the index follows the scroll position rather
  // than being set alongside it. IntersectionObserver rather than
  // `scrollsnapchange`, which Safari (and so every iOS in-app browser) lacks.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || count < 2) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.intersectionRatio >= 0.6) {
            setIndex(Number((entry.target as HTMLElement).dataset.index));
          }
        }
      },
      {root: track, threshold: 0.6},
    );
    for (const slide of track.children) observer.observe(slide);
    return () => observer.disconnect();
  }, [count]);

  // Nobody is watching a story that has scrolled away; hold it where it is.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      {threshold: 0.2},
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const goTo = useCallback((target: number, instant = false) => {
    const track = trackRef.current;
    const slide = track?.children[target] as HTMLElement | undefined;
    if (!track || !slide) return;
    track.scrollTo({
      left: slide.offsetLeft,
      // `auto` is an instant jump here: the track sets no `scroll-behavior`.
      behavior: instant || reducedMotion.current ? 'auto' : 'smooth',
    });
  }, []);

  const advance = () => {
    const next = (index + 1) % count;
    // Wrap with a jump. Smooth-scrolling back through every slide would flick
    // the headline through each routine on the way past.
    goTo(next, next === 0);
  };

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-heading"
      // The header switches to its dark coat while it floats over this.
      data-header-tone="dark"
      // Full-bleed past the 1rem margin `reset.css` puts on `body > main`.
      className="relative isolate -mx-4 w-[calc(100%+2rem)] overflow-hidden bg-[#003e15] px-6 pb-0 pt-24 lg:px-[7vw] lg:pt-36"
    >
      {/* Two soft lights: lime behind the card, orange low on the left. Radial
          rather than solid discs — a hard arc on a flat dark field reads as a
          rendering mistake. */}
      <span
        aria-hidden="true"
        className="absolute -right-48 top-24 -z-10 size-[38rem] lg:-right-24 lg:top-0 lg:size-[62rem]"
        style={{
          background:
            'radial-gradient(closest-side,rgba(164,232,170,.30),rgba(164,232,170,0))',
        }}
      />
      <span
        aria-hidden="true"
        className="absolute -bottom-40 -left-48 -z-10 size-[30rem] lg:size-[44rem]"
        style={{
          background:
            'radial-gradient(closest-side,rgba(191,86,14,.38),rgba(191,86,14,0))',
        }}
      />

      <div className="mx-auto max-w-md pb-12 lg:max-w-[80rem] lg:pb-20">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] lg:gap-x-16 lg:gap-y-0 xl:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] xl:gap-x-24">
          {/* ── Hook ─────────────────────────────────────────────────── */}
          <div className="min-w-0 lg:col-start-1 lg:row-start-1 lg:self-end">
            <p className="mb-0 inline-flex items-center gap-2 rounded-full bg-white/10 py-1.5 pl-2.5 pr-3.5 font-heading text-xs font-bold uppercase tracking-[0.14em] text-[#c9f7cc] ring-1 ring-white/15 lg:text-sm">
              <span aria-hidden="true" className="relative flex size-2">
                <span className="absolute inline-flex size-full rounded-full bg-[#ff8a3d] opacity-75 motion-safe:animate-ping" />
                <span className="relative inline-flex size-2 rounded-full bg-[#ff8a3d]" />
              </span>
              {onSale
                ? `Up to ${bestDeal}% off right now`
                : 'For very good animals'}
            </p>

            {/* Two fixed lines whatever the word, so the swap never moves
                anything below it: `whitespace-nowrap` holds line one, and
                every routine label is short enough to fit it at 320px. */}
            <h1
              id="hero-heading"
              className="mb-0 mt-4 font-heading text-[clamp(2.9rem,13vw,4.5rem)] font-semibold leading-[0.88] tracking-[-0.055em] text-[#f3fff1] lg:mt-6 lg:text-[clamp(3.5rem,5.6vw,6.5rem)] xl:text-[clamp(4rem,6.6vw,7rem)]"
            >
              <span className="sr-only">{routinesSentence(slides)}</span>
              <span aria-hidden="true" className="block">
                <span
                  key={routine}
                  className={cn(
                    'relative inline-block whitespace-nowrap text-[#a4e8aa]',
                    wordMotion &&
                      'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-500',
                  )}
                >
                  {routine},
                  <svg
                    viewBox="0 0 200 12"
                    preserveAspectRatio="none"
                    fill="none"
                    className="absolute -bottom-[0.12em] left-0 h-[0.16em] w-[calc(100%-0.35em)] text-primary"
                  >
                    <path
                      d="M2 8c22-6 44-6 66-1s44 5 66 0 44-5 64 0"
                      stroke="currentColor"
                      strokeWidth="5"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </span>
              </span>
              <span aria-hidden="true" className="block">
                upgraded.
              </span>
            </h1>
          </div>

          {/* ── The story card ───────────────────────────────────────── */}
          <div className="relative isolate min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
            {/* A loose stack behind the card — reads as "more where this came
                from" before the visitor has noticed the progress bars. */}
            <span
              aria-hidden="true"
              className="absolute inset-0 -z-10 translate-x-2 translate-y-1.5 rotate-[4deg] rounded-[2rem] bg-primary lg:translate-x-4 lg:rotate-[5deg] lg:rounded-[2.5rem]"
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 -z-10 -translate-x-1.5 -rotate-[3deg] rounded-[2rem] bg-[#a4e8aa]/25 lg:-translate-x-3 lg:-rotate-[4deg] lg:rounded-[2.5rem]"
            />

            {count > 0 ? (
              <div
                role="region"
                aria-roledescription="carousel"
                aria-label="Shop by product"
                className="group/story relative aspect-square overflow-hidden rounded-[2rem] bg-[#0b5a26] shadow-[0_30px_60px_-24px_rgba(0,0,0,0.65)] ring-1 ring-white/10 lg:rounded-[2.5rem]"
                onTouchStart={() => setTouching(true)}
                onTouchEnd={() => setTouching(false)}
                onTouchCancel={() => setTouching(false)}
              >
                <div
                  ref={trackRef}
                  className="relative flex size-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {slides.map((slide, i) => (
                    <div
                      key={slide.id}
                      data-index={i}
                      role="group"
                      aria-roledescription="slide"
                      aria-label={`${i + 1} of ${count}`}
                      className="relative size-full shrink-0 snap-start snap-always"
                    >
                      <StorySlide
                        slide={slide}
                        isFirst={i === 0}
                        // The next slide loads ahead of time; the rest wait
                        // until the story gets near them.
                        isNear={i <= index + 1}
                      />
                    </div>
                  ))}
                </div>

                {count > 1 ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-black/50 to-transparent"
                    />
                    <div className="absolute inset-x-3 top-2 flex items-center gap-2 lg:inset-x-4 lg:top-3">
                      <div
                        role="group"
                        aria-label="Choose a product"
                        className="flex flex-1 gap-1"
                      >
                        {slides.map((slide, i) => (
                          <button
                            key={slide.id}
                            type="button"
                            onClick={() => goTo(i)}
                            aria-label={`Show ${slide.title}`}
                            aria-current={i === index ? 'true' : undefined}
                            className={cn(
                              'flex h-7 flex-1 items-center rounded-sm',
                              FOCUS_RING,
                            )}
                          >
                            <span className="h-[3px] w-full overflow-hidden rounded-full bg-white/35">
                              <span
                                className={cn(
                                  'block h-full origin-left rounded-full bg-white',
                                  i < index && 'scale-x-100',
                                  i > index && 'scale-x-0',
                                  i === index &&
                                    (autoplay
                                      ? cn(
                                          'animate-[hero-progress_3.6s_linear_forwards] group-hover/story:[animation-play-state:paused] group-has-[:focus-visible]/story:[animation-play-state:paused]',
                                          !running &&
                                            '[animation-play-state:paused]',
                                        )
                                      : ready
                                        ? 'scale-x-100'
                                        : 'scale-x-0'),
                                )}
                                onAnimationEnd={
                                  i === index && autoplay ? advance : undefined
                                }
                              />
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* WCAG 2.2.2: anything that moves on its own for
                          more than five seconds needs a way to stop it. */}
                      <button
                        type="button"
                        onClick={() => setPlaying((value) => !value)}
                        aria-label={
                          playing ? 'Pause slideshow' : 'Play slideshow'
                        }
                        className={cn(
                          'grid size-8 shrink-0 place-items-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50',
                          FOCUS_RING,
                        )}
                      >
                        {playing ? (
                          <PauseIcon className="size-3.5" />
                        ) : (
                          <PlayIcon className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            ) : (
              <FallbackCard />
            )}
          </div>

          {/* ── Close ─────────────────────────────────────────────────── */}
          <div className="min-w-0 lg:col-start-1 lg:row-start-2 lg:self-start">
            <p className="mb-0 mt-7 hidden max-w-[30rem] text-lg leading-relaxed text-[#b9dcbc] lg:block">
              A small, hand-picked shelf for dogs and cats &mdash; every piece
              chosen to make one part of their day better.
            </p>

            <Link
              to={SHOP_HREF}
              prefetch="intent"
              className="group flex min-h-15 w-full items-center justify-between gap-5 rounded-full bg-primary py-1.5 pl-7 pr-1.5 font-heading text-lg font-semibold text-white shadow-[0_14px_30px_-12px_rgba(255,138,61,0.55)] transition-[transform,box-shadow,background-color] duration-300 hover:-translate-y-0.5 hover:bg-[#8f440b] hover:no-underline hover:shadow-[0_20px_38px_-12px_rgba(255,138,61,0.6)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a4e8aa] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:w-fit sm:justify-start lg:mt-10 lg:min-h-16 lg:pl-8 lg:text-xl"
            >
              {onSale ? 'Shop the sale' : 'Shop the collection'}
              <span className="relative grid size-12 place-items-center overflow-hidden rounded-full bg-white text-primary">
                <ArrowRightIcon className="size-5 transition-transform duration-300 motion-safe:group-hover:translate-x-[220%]" />
                <ArrowRightIcon className="absolute size-5 -translate-x-[220%] transition-transform duration-300 motion-safe:group-hover:translate-x-0" />
              </span>
            </Link>
          </div>
        </div>
      </div>

      <FactStrip
        facts={
          onSale ? [`Up to ${bestDeal}% off`, ...STRIP_FACTS] : STRIP_FACTS
        }
        paused={!(ready && playing && onScreen)}
      />
    </section>
  );
}

function StorySlide({
  slide,
  isFirst,
  isNear,
}: {
  slide: HeroProductSlide;
  isFirst: boolean;
  isNear: boolean;
}) {
  return (
    <Link
      to={`/products/${slide.handle}`}
      prefetch="intent"
      className="group/slide block size-full focus-visible:outline-none"
    >
      <Image
        data={slide.image}
        // The link's text (name, price) already says what this is, and the
        // store's media alt text is content hashes — worse than nothing aloud.
        alt=""
        aspectRatio="1/1"
        crop="center"
        sizes={CARD_SIZES}
        loading={isFirst || isNear ? 'eager' : 'lazy'}
        {...(isFirst ? LCP_PRIORITY : HIDDEN_PRIORITY)}
        className="size-full rounded-none! object-cover transition-transform duration-700 ease-out motion-safe:group-hover/slide:scale-[1.04]"
      />

      {slide.percentOff >= MIN_HEADLINE_DISCOUNT ? (
        <span className="absolute left-3 top-12 -rotate-6 rounded-xl bg-primary px-3 py-1.5 font-heading text-base font-bold uppercase leading-none tracking-[-0.01em] text-white shadow-[0_8px_18px_-6px_rgba(0,0,0,0.5)] lg:left-4 lg:top-14 lg:text-lg">
          {slide.percentOff}% off
        </span>
      ) : null}

      <span className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-[1.4rem] bg-white/95 p-2 pl-4 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.45)] ring-1 ring-black/5 backdrop-blur-md transition-[box-shadow] group-focus-visible/slide:outline-3 group-focus-visible/slide:outline-offset-2 group-focus-visible/slide:outline-[#a4e8aa] lg:inset-x-4 lg:bottom-4 lg:pl-5">
        <span className="min-w-0 flex-1">
          <span className="block truncate font-heading text-[0.95rem] font-semibold leading-tight text-[#004817] lg:text-base">
            {slide.title}
          </span>
          <span className="mt-1 flex items-baseline gap-2">
            <Money
              as="span"
              data={slide.price}
              className="font-heading text-lg font-bold leading-none tracking-[-0.02em] text-primary"
            />
            {slide.compareAtPrice ? (
              <s className="font-heading text-sm leading-none text-[#347345]/70">
                <span className="sr-only">Was </span>
                <Money as="span" data={slide.compareAtPrice} />
              </s>
            ) : null}
          </span>
        </span>
        <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-primary text-white lg:size-12">
          <ArrowRightIcon className="size-5 transition-transform duration-300 motion-safe:group-hover/slide:translate-x-[220%]" />
          <ArrowRightIcon className="absolute size-5 -translate-x-[220%] transition-transform duration-300 motion-safe:group-hover/slide:translate-x-0" />
        </span>
      </span>
    </Link>
  );
}

/** Only for an empty or failed Storefront query: still a card, still a way in. */
function FallbackCard() {
  return (
    <Link
      to={SHOP_HREF}
      prefetch="intent"
      className={cn(
        'relative block aspect-square overflow-hidden rounded-[2rem] bg-[#0b5a26] ring-1 ring-white/10 lg:rounded-[2.5rem]',
        FOCUS_RING,
      )}
    >
      <img
        src={heroPet}
        srcSet={FALLBACK_SRCSET}
        sizes={CARD_SIZES}
        alt="A cream Labrador leaning down to greet a small grey kitten on a wooden living room floor."
        width="750"
        height="1000"
        {...LCP_PRIORITY}
        decoding="async"
        className="size-full rounded-none! object-cover"
      />
      <span className="absolute bottom-3 left-3 rounded-full bg-white px-5 py-3 font-heading text-base font-semibold text-[#00521d] shadow-sm">
        Shop the collection
      </span>
    </Link>
  );
}

/**
 * The trust line, as a moving band across the hero's foot. The visible band is
 * decorative (it renders every fact several times to loop seamlessly), so
 * screen readers get one plain list instead.
 */
function FactStrip({
  facts,
  paused,
}: {
  facts: ReadonlyArray<string>;
  paused: boolean;
}) {
  // Two runs per half, so even a 1920px-wide band never shows the seam.
  const run = [0, 1].flatMap((repeat) =>
    facts.map((fact) => ({fact, id: `${repeat}-${fact}`})),
  );

  return (
    <div className="-mx-6 bg-[#a4e8aa] text-[#003e15] lg:-mx-[7vw]">
      <ul className="sr-only">
        {facts.map((fact) => (
          <li key={fact}>{fact}</li>
        ))}
      </ul>
      <div aria-hidden="true" className="overflow-hidden py-3 lg:py-4">
        <div
          className={cn(
            'flex w-max motion-safe:animate-[hero-marquee_40s_linear_infinite]',
            paused && '[animation-play-state:paused]',
          )}
        >
          {[0, 1].map((half) => (
            <div key={half} className="flex shrink-0 items-center">
              {run.map(({fact, id}) => (
                <span
                  key={id}
                  className="flex items-center gap-5 whitespace-nowrap pr-5 font-heading text-sm font-bold uppercase tracking-[0.12em] lg:text-base"
                >
                  <PawIcon className="size-4 text-primary" />
                  {fact}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
