import {useCallback, useEffect, useId, useRef, useState} from 'react';
import {Link} from 'react-router';
import routinePlay from '~/assets/routine-play.jpg';
import routineSnooze from '~/assets/routine-snooze.jpg';
import routineTreat from '~/assets/routine-treat.jpg';
import routineWalk from '~/assets/routine-walk.jpg';
import {ArrowRightIcon} from '~/components/icons';

type Routine = {
  id: string;
  label: string;
  query: string;
  image: string;
  alt: string;
};

const ROUTINES: readonly Routine[] = [
  {
    id: 'walk',
    label: 'Walk',
    query: 'walk',
    image: routineWalk,
    alt: 'A dog walking outdoors on a leash.',
  },
  {
    id: 'play',
    label: 'Play',
    query: 'toy',
    image: routinePlay,
    alt: 'A pet mid-play with a toy.',
  },
  {
    id: 'snooze',
    label: 'Snooze',
    query: 'bed',
    image: routineSnooze,
    alt: 'A pet curled up asleep.',
  },
  {
    id: 'treat',
    label: 'Treat',
    query: 'treat',
    image: routineTreat,
    alt: 'A pet reaching for a treat.',
  },
];

export function ShopByRoutine() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const activeIndexRef = useRef(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const baseId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState({x: 0, y: 0, w: 0, h: 0});
  const [pillReady, setPillReady] = useState(false);

  const active = ROUTINES[activeIndex];

  // Reading the current index from a ref (not state) keeps `goTo` stable, so the
  // autoplay timer added in Task 4 never needs to be torn down on every switch.
  const goTo = useCallback((next: number) => {
    const current = activeIndexRef.current;
    if (current === next) return;
    activeIndexRef.current = next;
    setPrevIndex(current);
    setActiveIndex(next);
  }, []);

  // The rail is vertical on desktop and horizontal on mobile from the same DOM,
  // so both axes are accepted and no aria-orientation is declared.
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      const count = ROUTINES.length;
      const current = activeIndexRef.current;
      let next: number;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          next = (current + 1) % count;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          next = (current - 1 + count) % count;
          break;
        case 'Home':
          next = 0;
          break;
        case 'End':
          next = count - 1;
          break;
        default:
          return;
      }

      event.preventDefault();
      goTo(next);
      tabRefs.current[next]?.focus();
    },
    [goTo],
  );

  // Measure the active tab and park the pill on it. offsetLeft/offsetTop are
  // relative to the offsetParent, which is the `relative` tablist.
  useEffect(() => {
    const tab = tabRefs.current[activeIndex];
    const list = listRef.current;
    if (!tab || !list) return;

    const update = () => {
      setPill({
        x: tab.offsetLeft,
        y: tab.offsetTop,
        w: tab.offsetWidth,
        h: tab.offsetHeight,
      });
      setPillReady(true);
    };

    update();

    // The rail flips axis at the lg breakpoint and the words rewrap, so the
    // pill has to re-measure on resize, not just on selection.
    const observer = new ResizeObserver(update);
    observer.observe(list);
    observer.observe(tab);
    return () => observer.disconnect();
  }, [activeIndex]);

  return (
    <section
      aria-labelledby="shop-routine-heading"
      className="-mx-4 w-[calc(100%+2rem)] overflow-hidden bg-[#a4e8aa] px-4! py-4! lg:px-6! lg:py-6!"
    >
      <div className="relative mx-auto max-w-[92rem] overflow-hidden rounded-[2.25rem] bg-[#00521d] px-6 py-14 lg:rounded-[3rem] lg:px-[5vw] lg:py-20">
        <span
          aria-hidden="true"
          className="absolute -bottom-32 -right-24 z-0 size-[26rem] rounded-full bg-primary sm:size-[32rem] lg:-bottom-40 lg:right-[-8rem] lg:size-[40rem]"
        />

        <div className="relative z-20 grid gap-12 lg:grid-cols-[1fr_minmax(20rem,32rem)] lg:items-center lg:gap-16">
          <div>
            <p className="font-heading text-sm! font-bold uppercase tracking-[0.16em] text-[#a4e8aa]">
              Shop their routine
            </p>
            <h2
              id="shop-routine-heading"
              className="mb-0! mt-4! max-w-[12ch] font-heading text-5xl! font-semibold! leading-[0.9]! tracking-[-0.065em] text-white sm:text-6xl! lg:text-7xl!"
            >
              Built around their favorite words.
            </h2>

            <div
              ref={listRef}
              role="tablist"
              aria-label="Shop by pet routine"
              className="relative mt-10 flex gap-1 overflow-x-auto lg:mt-12 lg:flex-col lg:items-start lg:overflow-visible"
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute left-0 top-0 z-0 rounded-2xl bg-primary ${
                  pillReady
                    ? 'transition-[transform,width,height] duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none'
                    : 'opacity-0'
                }`}
                style={{
                  transform: `translate3d(${pill.x}px, ${pill.y}px, 0)`,
                  width: `${pill.w}px`,
                  height: `${pill.h}px`,
                }}
              />
              {ROUTINES.map((routine, index) => {
                const selected = index === activeIndex;
                return (
                  <button
                    key={routine.id}
                    ref={(node) => {
                      tabRefs.current[index] = node;
                    }}
                    type="button"
                    role="tab"
                    id={`${baseId}-tab-${routine.id}`}
                    aria-selected={selected}
                    aria-controls={`${baseId}-panel`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => goTo(index)}
                    onMouseEnter={() => goTo(index)}
                    onKeyDown={onKeyDown}
                    className={`relative z-10 shrink-0 cursor-pointer rounded-2xl px-5 py-3 text-left font-heading text-2xl font-semibold tracking-[-0.04em] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white lg:px-6 lg:py-3 lg:text-4xl ${
                      selected
                        ? 'text-white'
                        : 'text-white/45 hover:text-white/80'
                    }`}
                  >
                    {routine.label}
                  </button>
                );
              })}
            </div>

            <p className="mt-8 max-w-[31rem] text-lg! leading-relaxed! text-[#d9f7d5]">
              Find the useful little things that make walks easier, playtime
              longer, and the best nap spot even better.
            </p>
          </div>

          <div
            id={`${baseId}-panel`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-${active.id}`}
            className="relative isolate"
          >
            <span
              key={active.id}
              aria-hidden="true"
              className="pointer-events-none absolute -top-8 right-2 z-0 select-none font-heading text-[6rem] font-semibold uppercase leading-none tracking-[-0.06em] text-white/[0.07] animate-in fade-in slide-in-from-bottom-6 duration-700 motion-reduce:animate-none lg:-top-14 lg:text-[9rem]"
            >
              {active.label}
            </span>

            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] bg-[#003d15] lg:rounded-[2.5rem]">
              {ROUTINES.map((routine, index) => {
                const selected = index === activeIndex;
                const leaving = index === prevIndex && !selected;

                const layerClass = selected
                  ? 'z-20 opacity-100 [clip-path:inset(0_0_0_0%)] transition-[clip-path,opacity] duration-700 [transition-timing-function:cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-[opacity] motion-reduce:duration-150'
                  : leaving
                    ? 'z-10 opacity-0 [clip-path:inset(0_0_0_0%)] transition-opacity duration-500 motion-reduce:duration-150'
                    : 'z-0 opacity-0 [clip-path:inset(0_0_0_100%)]';

                const imageClass = selected
                  ? 'scale-100 transition-transform duration-700 ease-out motion-reduce:transition-none'
                  : leaving
                    ? 'scale-[1.06] transition-transform duration-700 ease-out motion-reduce:transition-none'
                    : 'scale-[1.12]';

                return (
                  <div
                    key={routine.id}
                    aria-hidden={!selected}
                    className={`absolute inset-0 overflow-hidden ${layerClass}`}
                  >
                    <img
                      src={routine.image}
                      alt={routine.alt}
                      width="1000"
                      height="1250"
                      loading="lazy"
                      decoding="async"
                      className={`size-full rounded-none! object-cover ${imageClass}`}
                    />
                  </div>
                );
              })}

              <Link
                to={`/search?q=${active.query}`}
                className="absolute bottom-5 left-5 z-30 inline-flex min-h-14 items-center gap-4 rounded-full bg-white py-2 pl-6 pr-2 font-heading text-base font-semibold text-[#00521d]! transition-transform hover:scale-[1.03] hover:no-underline! focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white lg:bottom-7 lg:left-7 lg:text-lg"
              >
                Shop {active.label.toLowerCase()}
                <span className="grid size-11 place-items-center rounded-full bg-primary text-white">
                  <ArrowRightIcon className="size-5" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
