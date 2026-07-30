import {useEffect, useState} from 'react';
import {Money} from '@shopify/hydrogen';
import type {RecommendedProductFragment} from 'storefrontapi.generated';
import {ArrowRightIcon} from '~/components/icons';
import {
  LEATHER_COLLECTION_HREF,
  LEATHER_CTA_SECTION_IDS,
  LEATHER_HERO_ID,
} from '~/components/leather/LeatherCta';
import {cn} from '~/lib/utils';

/**
 * Phone-only persistent CTA. Ad traffic arrives on a phone, reads two screens,
 * and then has no button in reach until it scrolls back up — this keeps one
 * there. It appears once the hero is fully scrolled past, and hides again while
 * the product grid is on screen, since a button that scrolls you to what you
 * are already looking at is just noise.
 *
 * It watches the hero *section*, not a zero-height sentinel after it, and that
 * is load-bearing. A point sentinel reads as "not intersecting" both above and
 * below the viewport, so a jump that skips the intersecting state — the anchor
 * jump this very button performs, scroll restoration on back-navigation, a
 * flick scroll — changes no boolean, fires no callback, and strands the bar in
 * whatever state it was last in. The hero starts at the top of the document, so
 * "not intersecting" can only ever mean "scrolled past it".
 *
 * Sits at z-40 and stops short of the bottom-right corner so it never covers
 * `CartFab` (z-50, `bottom-6 right-6`, 3.5rem across) — reaching the cart has
 * to beat reaching this.
 */
export function LeatherStickyCta({
  fromPrice,
}: {
  fromPrice: RecommendedProductFragment['priceRange']['minVariantPrice'] | null;
}) {
  const [pastHero, setPastHero] = useState(false);
  // Tracked as a set of ids rather than a boolean: the sections are adjacent,
  // so one can scroll in before the other has scrolled out, and a shared flag
  // would let the second one's exit clear the first one's entry.
  const [visibleCtaSections, setVisibleCtaSections] = useState<readonly string[]>(
    [],
  );

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const watch = (id: string, onChange: (onScreen: boolean) => void) => {
      const observer = new IntersectionObserver(
        ([entry]) => onChange(entry.isIntersecting),
        {threshold: 0},
      );
      const element = document.getElementById(id);
      if (element) observer.observe(element);
      return observer;
    };

    const observers = [
      watch(LEATHER_HERO_ID, (onScreen) => setPastHero(!onScreen)),
      ...LEATHER_CTA_SECTION_IDS.map((id) =>
        watch(id, (onScreen) =>
          setVisibleCtaSections((current) => {
            const next = current.filter((seen) => seen !== id);
            return onScreen ? [...next, id] : next;
          }),
        ),
      ),
    ];

    return () => observers.forEach((observer) => observer.disconnect());
  }, []);

  const visible = pastHero && visibleCtaSections.length === 0;

  return (
    <div
      className={cn(
        'fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 right-[5.75rem] z-40 transition-[transform,opacity,visibility] duration-300 ease-out motion-reduce:transition-none lg:hidden',
        // `invisible` rather than opacity alone: it takes the link out of the
        // tab order and the accessibility tree, so a keyboard or screen
        // reader user never lands on a control that isn't on screen.
        visible
          ? 'visible translate-y-0 opacity-100'
          : 'invisible translate-y-[130%] opacity-0',
      )}
    >
      <a
        href={LEATHER_COLLECTION_HREF}
        className="flex min-h-14 items-center justify-between gap-2.5 rounded-full bg-primary py-2 pl-5 pr-2 font-heading text-base font-semibold text-white no-underline! shadow-[0_16px_34px_-12px_rgba(0,0,0,0.6)] transition-colors hover:bg-[#8f440b] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2e1c12]"
      >
        {/* The bar reserves the bottom-right corner for CartFab, so the label
            has ~200px on a 390px phone. The price rides at `text-sm` to fit
            beside it; `truncate` is the fallback on narrower phones and on
            currencies that render wider than USD. */}
        <span className="min-w-0 truncate">
          Shop leather
          {fromPrice ? (
            <span className="ml-2 text-sm font-normal text-white/80">
              from <Money as="span" data={fromPrice} />
            </span>
          ) : null}
        </span>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-primary">
          <ArrowRightIcon className="size-5" />
        </span>
      </a>
    </div>
  );
}
