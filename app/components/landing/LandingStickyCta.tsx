import {useEffect, useState} from 'react';
import {Link} from 'react-router';
import {Money} from '@shopify/hydrogen';
import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';
import {ArrowRightIcon} from '~/components/icons';
import {cn} from '~/lib/utils';

/**
 * Phone-only persistent CTA for landing pages. Ad traffic arrives on a phone,
 * reads two screens, and then has no button in reach until it scrolls back up —
 * this keeps one there. It appears once the hero is scrolled past and stands
 * down again while any section that already shows a CTA is on screen.
 *
 * It watches the hero *section*, not a zero-height sentinel after it, and that
 * is load-bearing. A point sentinel reads as "not intersecting" both above and
 * below the viewport, so a jump that skips the intersecting state — an anchor
 * jump, scroll restoration on back-navigation, a flick scroll — changes no
 * boolean, fires no callback, and strands the bar in whatever state it was last
 * in. The hero starts at the top of the document, so "not intersecting" can
 * only ever mean "scrolled past it".
 *
 * Sits at z-40 and stops short of the bottom-right corner so it never covers
 * `CartFab` (z-50, `bottom-6 right-6`, 3.5rem across) — reaching the cart has
 * to beat reaching this.
 */
export function LandingStickyCta({
  heroId,
  quietSectionIds,
  href,
  label,
  price,
  priceLabel,
}: {
  /** Section the bar waits to clear before appearing. Must start the page. */
  heroId: string;
  /** Sections that already show a CTA; the bar hides while any is visible. */
  quietSectionIds: readonly string[];
  href: string;
  label: string;
  price?: Pick<MoneyV2, 'amount' | 'currencyCode'> | null;
  /**
   * Qualifier before the price — "from" on a page selling a range. Omit it on a
   * single product priced the same across every variant, where "from" would
   * imply a cheaper option that doesn't exist.
   */
  priceLabel?: string;
}) {
  const [pastHero, setPastHero] = useState(false);
  // Tracked as a set of ids rather than a boolean: the quiet sections can be
  // adjacent, so one may scroll in before another has scrolled out, and a
  // shared flag would let the second one's exit clear the first one's entry.
  const [visibleQuietSections, setVisibleQuietSections] = useState<
    readonly string[]
  >([]);

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
      watch(heroId, (onScreen) => setPastHero(!onScreen)),
      ...quietSectionIds.map((id) =>
        watch(id, (onScreen) =>
          setVisibleQuietSections((current) => {
            const next = current.filter((seen) => seen !== id);
            return onScreen ? [...next, id] : next;
          }),
        ),
      ),
    ];

    return () => observers.forEach((observer) => observer.disconnect());
    // `quietSectionIds` is a module-level constant at every call site; spreading
    // it into the dep array would re-run this on every render for a literal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroId]);

  const visible = pastHero && visibleQuietSections.length === 0;

  const body = (
    <>
      {/* The bar reserves the bottom-right corner for CartFab, so the label has
          ~200px on a 390px phone. The price rides at `text-sm` to fit beside it;
          `truncate` is the fallback on narrower phones and on currencies that
          render wider than USD. */}
      <span className="min-w-0 truncate">
        {label}
        {price ? (
          <span className="ml-2 text-sm font-normal text-white/80">
            {priceLabel ? `${priceLabel} ` : null}
            <Money as="span" data={price} />
          </span>
        ) : null}
      </span>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-primary">
        <ArrowRightIcon className="size-5" />
      </span>
    </>
  );

  const barClass =
    'flex min-h-14 items-center justify-between gap-2.5 rounded-full bg-primary py-2 pl-5 pr-2 font-heading text-base font-semibold text-white no-underline! shadow-[0_16px_34px_-12px_rgba(0,0,0,0.6)] transition-colors hover:bg-[#8f440b] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2e1c12]';

  return (
    <div
      className={cn(
        'fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 right-[5.75rem] z-40 transition-[transform,opacity,visibility] duration-300 ease-out motion-reduce:transition-none lg:hidden',
        // `invisible` rather than opacity alone: it takes the link out of the
        // tab order and the accessibility tree, so a keyboard or screen reader
        // user never lands on a control that isn't on screen.
        visible
          ? 'visible translate-y-0 opacity-100'
          : 'invisible translate-y-[130%] opacity-0',
      )}
    >
      {href.startsWith('#') ? (
        <a href={href} className={barClass}>
          {body}
        </a>
      ) : (
        <Link to={href} prefetch="intent" className={barClass}>
          {body}
        </Link>
      )}
    </div>
  );
}
