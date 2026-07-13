# Shop By Routine — Routine Switcher

**Date:** 2026-07-13
**Component:** `app/components/home/ShopByRoutine.tsx`

## Problem

The section's copy works, but the UI does not. Two complaints:

1. **The interaction is unrewarding.** The four routine cards (Walk / Play / Snooze / Treat) are links whose only hover state is a 4px lift and an arrow nudge. There is no payoff for engaging with them, so a section built entirely around four choices gives you no reason to explore those choices.
2. **The imagery is wrong.** The section reuses `img-dachshund.png`, which the hero already renders twice. It is decoration, not content, and it repeats.

## Design

Turn the four routines from four links into a **switcher**. Selecting a routine reveals a photo of that routine in a large stage beside the rail. The section stops being a decorated list and becomes something you operate.

### Structure

`ShopByRoutine.tsx` remains a single file and keeps its named export. The existing `ROUTINES` array becomes the section's source of truth:

```ts
{id, label, query, image, alt}
```

The outer green band (`bg-[#a4e8aa]`), the inner dark panel (`bg-[#00521d]`), the eyebrow, the headline, and the orange circle all stay — the section must still read as part of the same page.

Inside the dark panel, two columns on desktop:

- **Left:** headline, the vertical word rail, the supporting paragraph.
- **Right:** the photo stage.

On viewports below `lg`, the rail collapses to a horizontal row of chips above the stage. Touch users still get the switch animation; this is the reason the rail selects rather than navigates (see Interaction).

### Photos

Four Pexels JPEGs (free license, no attribution required) in `app/assets/`:

| File | Subject |
|---|---|
| `routine-walk.jpg` | A dog mid-walk, on a leash |
| `routine-play.jpg` | A cat or dog mid-pounce on a toy |
| `routine-snooze.jpg` | A pet asleep |
| `routine-treat.jpg` | A pet taking a treat |

Roughly 1000×1250, compressed to under ~120KB each. All four are `loading="lazy"` and `decoding="async"` — the section sits below the fold, so none of them compete with the hero's LCP.

Each photo must be viewed with the Read tool before it is committed. A photo whose subject does not clearly read as its routine is rejected and re-sourced.

### Interaction

The rail selects; the stage navigates.

- Rail items are **buttons**. Hover, click, or arrow keys select a routine and preview its photo.
- The stage contains the **link** — a "Shop walk →" button whose `to` updates with the selection (`/search?q=${query}`).

This is what makes the section work on touch. If the rail items stayed links, a tap would navigate immediately and mobile would never see the switch.

### Motion

Three things happen together on every switch:

**The photo wipes in.** The incoming photo animates `clip-path: inset(0 0 0 100%)` → `inset(0 0 0 0)` over ~700ms `cubic-bezier(0.65, 0, 0.35, 1)`. Inside that mask, the image itself settles from `scale(1.12)` to `scale(1)`, so the reveal carries parallax instead of reading as a flat curtain. The outgoing photo drifts to `scale(1.06)` and fades beneath it.

**The active pill slides.** One absolutely-positioned element tracks the active word via `translateY`, with a slight overshoot (`cubic-bezier(0.34, 1.56, 0.64, 1)`). It is a single element that moves, not four elements that each toggle a background — that difference is what makes it feel like one object following the cursor rather than four things blinking.

**The ghost word swaps.** The active routine's label renders oversized behind the photo stage at ~6% white opacity, translating in on each switch. It gives the stage depth and reinforces the "favorite words" headline.

### Auto-advance

While the section is in the viewport and untouched, it advances every ~4.5s. A thin progress bar fills beneath the active word so the motion reads as a deliberate cycle rather than random movement — it is the section demonstrating that it is interactive.

- Stops **permanently** on the first hover, focus, or click anywhere in the section.
- Pauses when the section leaves the viewport (IntersectionObserver) or the tab is hidden (`visibilitychange`).
- Does not run at all under `prefers-reduced-motion`.

### Accessibility

The rail is a proper ARIA tabs widget:

- Rail: `role="tablist"`. It renders vertically on desktop and horizontally on mobile from the same DOM, so no `aria-orientation` is declared and **both axes of arrow key are handled** (Up/Left move back, Down/Right move forward, wrapping at the ends). Declaring one orientation would be a lie at one breakpoint or the other.
- Items: `role="tab"`, `aria-selected`, `aria-controls`, roving `tabindex` (only the active tab is tabbable).
- Arrow keys move the selection; `Tab` moves out of the rail and into the stage's Shop link.
- Stage: `role="tabpanel"`, `aria-labelledby` the active tab.
- Each photo carries real `alt` text describing its scene.
- Focus-visible rings on rail items and the Shop link, matching the existing white outline treatment.

Under `prefers-reduced-motion`, auto-advance is disabled and the wipe collapses to a 150ms opacity fade. The section still works; it just stops performing.

## Constraints

- **Do not touch `app/styles/tailwind.css`.** The user owns the theme. Greens are arbitrary values (`#00521d`, `#a4e8aa`, `#effce9`, `#d9f7d5`); orange is the `primary` token. No new palette colors.
- `reset.css` element rules are unlayered and beat Tailwind utilities. Headings, section padding, and `img` rules in this section need `!` overrides — the existing code already does this and the pattern must be preserved.
- No new dependencies. Motion is CSS transitions driven by React state; no animation library.

## Verification

There is no test runner in this repo. Verification is:

1. `npm run typecheck` and `npm run lint` pass.
2. The section is driven in a real browser: each routine is selected by click, by hover, and by arrow key; the wipe, the sliding pill, and the ghost word are observed; the Shop link's href is confirmed to update.
3. Auto-advance is observed starting, and observed stopping permanently after interaction.
4. The mobile layout is checked at a narrow viewport.
5. `prefers-reduced-motion` is emulated and the fade fallback confirmed.
