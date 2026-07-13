# Shop By Routine Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the homepage "Shop their routine" section from four static links into an interactive switcher where each routine reveals its own photo in a large stage via an animated clip-wipe.

**Architecture:** A single component, `app/components/home/ShopByRoutine.tsx`, holds an active-index state. A `ROUTINES` config array is the source of truth (label, search query, photo, alt). The four routines render as an ARIA tabs rail (buttons that select); the photo stage is the tabpanel and holds the link to `/search`. All motion is CSS transitions driven by React state — no animation library. Four new Pexels JPEGs land in `app/assets/`.

**Tech Stack:** React Router 7, React 18 hooks, Tailwind v4 (utility classes only), `tw-animate-css` (already installed, v1.4.0), Vite asset imports.

**Spec:** `docs/superpowers/specs/2026-07-13-shop-by-routine-switcher-design.md`

## Global Constraints

- **Never edit `app/styles/tailwind.css`.** The user owns the theme. Greens are arbitrary values (`#00521d`, `#a4e8aa`, `#effce9`, `#d9f7d5`); orange is the `primary` token. Introduce no new palette colors.
- **`app.css` and `reset.css` are unlayered and beat Tailwind utilities.** The rules that bite this section: `img { border-radius: 4px }` (so every `<img>` needs `rounded-none!`), `h2 { font-size: 1.2rem; font-weight: 700; margin-bottom: 1rem }`, `section { padding: 1rem 0 }`, `p { margin: 0 }`, `a { color: #000 }` and `a:hover { text-decoration: underline }` (so links need `text-…!` and `hover:no-underline!`). There is no global `button` rule — only `button.reset` — so plain `<button>` needs no override.
- **No new dependencies.** No Framer Motion, no GSAP.
- **Import routing from `react-router`**, never `@remix-run/*` or `react-router-dom`.
- **No test runner exists in this repo.** Every task's verification is `npm run typecheck`, `npm run lint`, and driving the real page in a browser. Do not add a test framework.
- Path alias `~/*` → `app/*`.

---

### Task 1: Source and verify the four routine photos

Four photos, one per routine. Pexels' license is free for commercial use with no attribution required. Every photo must be **looked at** with the Read tool before it is committed — stock search for a word like "treat" returns plenty that is not a pet taking a treat.

**Files:**
- Create: `app/assets/routine-walk.jpg`
- Create: `app/assets/routine-play.jpg`
- Create: `app/assets/routine-snooze.jpg`
- Create: `app/assets/routine-treat.jpg`

**Interfaces:**
- Consumes: nothing.
- Produces: four JPEGs at those exact paths, each ~1000×1250 (4:5 portrait) and under ~120KB. Task 2 imports them by exactly these filenames.

- [ ] **Step 1: Find candidate photo IDs**

Use WebSearch / WebFetch against `pexels.com` to find candidate photo IDs for each subject:

| Routine | What the photo must show |
|---|---|
| walk | A dog outdoors mid-walk, on a leash |
| play | A cat or dog mid-play with a toy |
| snooze | A pet asleep |
| treat | A pet taking or reaching for a treat |

A Pexels photo page URL ends in its numeric ID, e.g. `pexels.com/photo/…-1108099/` → ID `1108099`.

Collect **2–3 candidate IDs per routine** so there is a fallback when one is rejected in Step 3.

- [ ] **Step 2: Download candidates at the right crop**

Pexels' CDN crops and compresses on the fly. Download each candidate into the scratchpad (NOT into `app/assets` — nothing enters the repo before it has been looked at):

```bash
mkdir -p /tmp/routine-candidates && cd /tmp/routine-candidates

# Repeat per candidate ID, naming each file <routine>-<id>.jpg.
# 1108099 below is an EXAMPLE id — substitute the ids found in Step 1.
curl -sL -o walk-1108099.jpg \
  "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1250&fit=crop"
```

The `w=1000&h=1250&fit=crop` params produce the 4:5 portrait crop the stage expects, already compressed.

- [ ] **Step 3: LOOK at every candidate before choosing**

For each downloaded candidate, use the **Read tool** on its absolute path. The Read tool renders images visually.

Reject a candidate if:
- The subject does not unmistakably read as its routine (a dog merely standing outdoors is not "walk"; a sleeping-looking cat that is actually just sitting is not "snooze").
- The crop decapitates the animal or puts the subject at the extreme edge — the stage is a 4:5 portrait and the subject must survive it.
- It is visually incoherent with the others (wildly different color temperature, or a heavy filter).

Pick the best candidate per routine. If all candidates for a routine are rejected, go back to Step 1 for that routine.

- [ ] **Step 4: Check size and dimensions, then place the winners**

```bash
cd /tmp/routine-candidates
# for each winner, copy to its final name
cp walk-<id>.jpg /Users/mike/Development/Projects/pawstie-storefront/app/assets/routine-walk.jpg
# …repeat for play, snooze, treat

cd /Users/mike/Development/Projects/pawstie-storefront
for f in app/assets/routine-*.jpg; do
  echo "$f  $(sips -g pixelWidth -g pixelHeight "$f" | tail -2 | tr -d ' \n')  $(du -h "$f" | cut -f1)"
done
```

Expected: each file reports `pixelWidth: 1000  pixelHeight: 1250` and a size under ~120K.

If any file exceeds ~120KB, recompress in place (`magick`/`cwebp` are NOT installed; `sips` is):

```bash
sips -s format jpeg -s formatOptions 70 app/assets/routine-<name>.jpg --out app/assets/routine-<name>.jpg
```

- [ ] **Step 5: Commit**

```bash
git add app/assets/routine-walk.jpg app/assets/routine-play.jpg app/assets/routine-snooze.jpg app/assets/routine-treat.jpg
git commit -m "Add routine photos for Shop By Routine switcher"
```

---

### Task 2: Rebuild ShopByRoutine as a static tabs switcher

Replace the section wholesale: config array, two-column layout, ARIA tabs rail, photo stage with the Shop link. **No motion yet** — photos swap instantly. This task is complete when the switcher *works*; Task 3 makes it *impressive*.

**Files:**
- Rewrite: `app/components/home/ShopByRoutine.tsx` (currently 67 lines; replace entirely)

**Interfaces:**
- Consumes: the four JPEGs from Task 1.
- Produces: `export function ShopByRoutine()` — unchanged signature, so `app/routes/_index.tsx` needs no edit. Internally establishes the names Tasks 3 and 4 build on: the `ROUTINES` array, `activeIndex` / `prevIndex` state, the `activeIndexRef` ref, and the `goTo(next: number)` callback.

- [ ] **Step 1: Write the component**

Replace the entire contents of `app/components/home/ShopByRoutine.tsx`:

```tsx
import {useCallback, useId, useRef, useState} from 'react';
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
    (event: React.KeyboardEvent<HTMLDivElement>) => {
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
            <p className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-[#a4e8aa]">
              Shop their routine
            </p>
            <h2
              id="shop-routine-heading"
              className="mb-0! mt-4! max-w-[12ch] font-heading text-5xl! font-semibold! leading-[0.9]! tracking-[-0.065em] text-white sm:text-6xl! lg:text-7xl!"
            >
              Built around their favorite words.
            </h2>

            <div
              role="tablist"
              aria-label="Shop by pet routine"
              onKeyDown={onKeyDown}
              className="relative mt-10 flex gap-1 overflow-x-auto lg:mt-12 lg:flex-col lg:items-start lg:overflow-visible"
            >
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

            <p className="mt-8 max-w-[31rem] text-lg leading-relaxed text-[#d9f7d5]">
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
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] bg-[#003d15] lg:rounded-[2.5rem]">
              {ROUTINES.map((routine, index) => {
                const selected = index === activeIndex;
                const leaving = index === prevIndex && !selected;
                return (
                  <div
                    key={routine.id}
                    aria-hidden={!selected}
                    className={`absolute inset-0 overflow-hidden ${
                      selected
                        ? 'z-20 opacity-100'
                        : leaving
                          ? 'z-10 opacity-0'
                          : 'z-0 opacity-0'
                    }`}
                  >
                    <img
                      src={routine.image}
                      alt={routine.alt}
                      width="1000"
                      height="1250"
                      loading="lazy"
                      decoding="async"
                      className="size-full rounded-none! object-cover"
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
```

Note on `prevIndex`: it is introduced here, and used here only to sit the outgoing photo at `z-10` (between the incoming photo and the idle ones). Task 3 is what gives it visible motion. It is established now so that `goTo` is written once and never revised — every later task builds on it unchanged.

- [ ] **Step 2: Typecheck and lint**

```bash
npm run typecheck && npm run lint
```

Expected: both pass.

- [ ] **Step 3: Drive it in a browser**

Start the dev server (`npm run dev`) and open the homepage. Using Playwright MCP or the browser directly, verify:
- Four routine words render; "Walk" is selected and its photo shows.
- Clicking "Snooze" swaps the photo to the sleeping pet and the button reads "Shop snooze".
- Hovering "Play" swaps to the play photo.
- Tab into the rail, press ArrowDown/ArrowRight — selection advances and focus follows. ArrowUp/ArrowLeft go back. Both wrap at the ends.
- The "Shop …" link's `href` is `/search?q=bed` when Snooze is active (note: the query is `bed`, not `snooze`).
- The heading is still large (not 1.2rem — that would mean the `!` overrides were lost) and no photo has rounded corners from `app.css`.

- [ ] **Step 4: Commit**

```bash
git add app/components/home/ShopByRoutine.tsx
git commit -m "Rebuild Shop By Routine as a tabs switcher"
```

---

### Task 3: Add the switch motion

Three simultaneous effects: the incoming photo clip-wipes in while its image settles from `scale(1.12)` to `scale(1)`; the outgoing photo drifts to `scale(1.06)` and fades beneath it; a single pill element slides between rail words; a giant ghost word swaps behind the stage.

Every photo layer is in exactly one of three states, which is what lets a single set of classes express both the entrance and the exit without a hidden layer visibly resetting itself:

| State | Meaning | Clip | Opacity | Image scale | Transition |
|---|---|---|---|---|---|
| `active` | the selected photo | `inset(0 0 0 0%)` | 1 | `1` | 700ms |
| `leaving` | the one just deselected (`prevIndex`) | `inset(0 0 0 0%)` | 0 | `1.06` | 500ms opacity / 700ms transform |
| `idle` | everything else | `inset(0 0 0 100%)` | 0 | `1.12` | **none** — snaps to its ready position |

`idle` must have no transition, otherwise a layer that is two switches old would visibly crawl back to its start position underneath the stage.

**Files:**
- Modify: `app/components/home/ShopByRoutine.tsx`

**Interfaces:**
- Consumes: `ROUTINES`, `activeIndex`, `prevIndex`, `goTo` from Task 2.
- Produces: a `listRef` and `pill` state that Task 4's progress bar positions itself against — specifically `pill: {x: number; y: number; w: number; h: number}` and `pillReady: boolean`.

- [ ] **Step 1: Add the sliding-pill measurement**

The rail is vertical at `lg` and horizontal below it, so the pill cannot be a fixed `translateY` step — it is measured from the DOM.

First add `useEffect` to the React import, which Task 2 did not need:

```tsx
import {useCallback, useEffect, useId, useRef, useState} from 'react';
```

Then add this state at the top of the component (after `const baseId = useId();`):

```tsx
const listRef = useRef<HTMLDivElement>(null);
const [pill, setPill] = useState({x: 0, y: 0, w: 0, h: 0});
const [pillReady, setPillReady] = useState(false);
```

Then add this effect below `onKeyDown`:

```tsx
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
```

- [ ] **Step 2: Render the pill inside the tablist**

Add `ref={listRef}` to the `role="tablist"` div, and insert this as its **first child**, before the `ROUTINES.map(...)`:

```tsx
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
```

`pillReady` gates both the transition and visibility so the pill does not animate out of the top-left corner on first paint.

- [ ] **Step 3: Replace the photo-layer classes with the three-state machine**

Replace the whole photo `ROUTINES.map(...)` block inside the stage with:

```tsx
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
```

- [ ] **Step 4: Add the ghost word behind the stage**

Insert as the first child of the `role="tabpanel"` div, before the stage div. `key={active.id}` remounts it on every switch, which re-fires the `tw-animate-css` entrance:

```tsx
            <span
              key={active.id}
              aria-hidden="true"
              className="pointer-events-none absolute -top-8 right-2 z-0 select-none font-heading text-[6rem] font-semibold uppercase leading-none tracking-[-0.06em] text-white/[0.07] animate-in fade-in slide-in-from-bottom-6 duration-700 motion-reduce:animate-none lg:-top-14 lg:text-[9rem]"
            >
              {active.label}
            </span>
```

- [ ] **Step 5: Typecheck and lint**

```bash
npm run typecheck && npm run lint
```

Expected: both pass.

- [ ] **Step 6: Drive the motion in a browser**

With `npm run dev` running, on the homepage:
- Click through all four routines. Each incoming photo wipes in from the right edge; it does not simply cross-fade.
- The image inside the wipe visibly settles (shrinks slightly) as it arrives.
- The orange pill *slides* between words with a slight overshoot. It does not blink from one word to the next.
- The giant ghost word changes with the selection and eases up as it appears.
- Resize the window across the `lg` breakpoint (1024px) with a routine selected: the rail flips from vertical to horizontal and the pill re-measures onto the right word rather than being stranded.
- Switch rapidly between routines — no photo layer is left visibly stranded mid-wipe or crawling back into place.

- [ ] **Step 7: Commit**

```bash
git add app/components/home/ShopByRoutine.tsx
git commit -m "Animate Shop By Routine switch with clip-wipe, sliding pill, ghost word"
```

---

### Task 4: Auto-advance, progress bar, and reduced motion

While the section is on screen and untouched, it cycles every 4.5s with a progress bar filling under the active word — so the motion reads as a deliberate demonstration that the section is interactive, not as random movement. The first hover, focus, or click stops it permanently.

The progress bar fills via a `transform: scaleX()` transition kicked off by a double `requestAnimationFrame` — **not** a `@keyframes` animation, because keyframes would have to be declared in `tailwind.css`, which is off-limits.

**Files:**
- Modify: `app/components/home/ShopByRoutine.tsx`

**Interfaces:**
- Consumes: `goTo`, `activeIndexRef`, `pill`, `pillReady` from Tasks 2–3.
- Produces: nothing downstream. This is the last task.

- [ ] **Step 1: Add the reduced-motion hook and the progress bar component**

Add above `export function ShopByRoutine()`:

```tsx
const AUTOPLAY_MS = 4500;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/**
 * Fills over `durationMs` whenever `resetKey` changes. Uses a transition rather
 * than a keyframe animation because keyframes would need a @keyframes block in
 * tailwind.css, which this project does not allow us to touch.
 */
function AutoplayProgress({
  durationMs,
  resetKey,
}: {
  durationMs: number;
  resetKey: number;
}) {
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    setFilled(false);
    // Two frames: the first lets the browser paint the scaleX(0) state, the
    // second flips it — a single frame would coalesce both and skip the fill.
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setFilled(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [resetKey]);

  return (
    <span className="absolute inset-x-0 bottom-0 block h-[3px] overflow-hidden rounded-full">
      <span
        className="block h-full origin-left rounded-full bg-white/80 transition-transform ease-linear"
        style={{
          transform: `scaleX(${filled ? 1 : 0})`,
          transitionDuration: `${durationMs}ms`,
        }}
      />
    </span>
  );
}
```

- [ ] **Step 2: Add the autoplay state and effects**

Inside `ShopByRoutine`, after the existing state declarations:

```tsx
  const [interacted, setInteracted] = useState(false);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const autoplaying = inView && !interacted && !reducedMotion;

  const stopAutoplay = useCallback(() => setInteracted(true), []);
```

Then add these two effects after the pill-measurement effect:

```tsx
  // Only cycle while the section is actually on screen.
  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      {threshold: 0.35},
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!autoplaying) return;

    let timer: ReturnType<typeof setInterval> | undefined;

    const start = () => {
      timer = setInterval(() => {
        goTo((activeIndexRef.current + 1) % ROUTINES.length);
      }, AUTOPLAY_MS);
    };

    const stop = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
    };

    const onVisibilityChange = () => {
      stop();
      if (!document.hidden) start();
    };

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [autoplaying, goTo]);
```

Because `goTo` reads `activeIndexRef` rather than `activeIndex`, this effect does not re-run on every switch — the interval keeps a steady 4.5s cadence instead of being reset each time it fires.

- [ ] **Step 3: Wire the stop triggers to the section**

Change the opening `<section>` tag to carry the ref and the three stop triggers. `onFocusCapture` catches keyboard users landing anywhere inside; `onPointerDown` catches touch, where no hover ever fires.

```tsx
    <section
      ref={sectionRef}
      aria-labelledby="shop-routine-heading"
      onMouseEnter={stopAutoplay}
      onFocusCapture={stopAutoplay}
      onPointerDown={stopAutoplay}
      className="-mx-4 w-[calc(100%+2rem)] overflow-hidden bg-[#a4e8aa] px-4! py-4! lg:px-6! lg:py-6!"
    >
```

- [ ] **Step 4: Render the progress bar inside the pill**

The bar rides the pill, so it goes immediately after the pill `<span>` in the tablist. It is positioned by the same measurements and only exists while autoplay runs:

```tsx
              {autoplaying && pillReady ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 top-0 z-20"
                  style={{
                    transform: `translate3d(${pill.x}px, ${pill.y}px, 0)`,
                    width: `${pill.w}px`,
                    height: `${pill.h}px`,
                  }}
                >
                  <AutoplayProgress
                    durationMs={AUTOPLAY_MS}
                    resetKey={activeIndex}
                  />
                </span>
              ) : null}
```

- [ ] **Step 5: Typecheck and lint**

```bash
npm run typecheck && npm run lint
```

Expected: both pass.

- [ ] **Step 6: Full verification pass in a browser**

With `npm run dev` running:

1. **Autoplay starts.** Load the homepage, scroll the section into view *without putting the cursor on it*, and wait. It advances Walk → Play → Snooze → Treat → Walk on a ~4.5s cadence, with the bar filling under the active word each time.
2. **Autoplay stops permanently.** Hover the section once, then move the cursor away and wait 10s. It must NOT resume.
3. **Reload, then stop it by keyboard.** Tab into the section — autoplay stops.
4. **Reload, then stop it by touch.** Emulate a touch device and tap a routine — autoplay stops and that routine is selected.
5. **Out-of-view pause.** Reload, leave the cursor off the section, scroll it off screen for ~15s, scroll back: it must not have raced ahead — it should resume from roughly where it left off.
6. **Tab-hidden pause.** Same, but switch browser tabs instead of scrolling.
7. **Reduced motion.** Emulate `prefers-reduced-motion: reduce`. Autoplay must not run at all, no progress bar renders, the pill jumps rather than slides, and switching a routine cross-fades in ~150ms with no wipe. The section still fully works.
8. **Mobile layout.** At a 390px-wide viewport: the rail is a horizontal scrolling row above the stage, the pill tracks correctly along it, the photo stage is a full-width 4:5, and the Shop link is reachable and not clipped.
9. **Regression check.** The rest of the homepage is unchanged — hero, New Arrivals, Everyday Promises, and the final CTA all still render correctly.

- [ ] **Step 7: Commit**

```bash
git add app/components/home/ShopByRoutine.tsx
git commit -m "Auto-advance Shop By Routine while idle, with reduced-motion fallback"
```
