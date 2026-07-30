import {ArrowRightIcon} from '~/components/icons';
import {cn} from '~/lib/utils';

/**
 * The id the page's primary CTA scrolls to. Every "shop" button on the landing
 * page points here rather than at `/shop`: paid traffic that leaves the page
 * has to be re-convinced by a page that was not written for the ad it clicked.
 */
export const LEATHER_COLLECTION_ID = 'collection';
export const LEATHER_COLLECTION_HREF = `#${LEATHER_COLLECTION_ID}`;

/** Watched by `LeatherStickyCta` to decide when the hero has been scrolled past. */
export const LEATHER_HERO_ID = 'leather-hero';

/**
 * Sections that already put a CTA on screen. The sticky bar stands down while
 * any of them is visible — a floating button that scrolls you to a button you
 * can already see is just noise, and at the foot of the page it would sit on
 * top of the copyright line.
 */
export const LEATHER_FINAL_CTA_ID = 'leather-final-cta';
export const LEATHER_CTA_SECTION_IDS = [
  LEATHER_COLLECTION_ID,
  LEATHER_FINAL_CTA_ID,
] as const;

/**
 * Same pill-with-a-disc shape as the home hero's CTA, in the leather page's
 * cognac. The arrow swaps out on hover — two copies chasing each other so the
 * disc never renders empty mid-transition.
 */
export function LeatherCta({
  href,
  children,
  tone = 'solid',
  className,
}: {
  href: string;
  children: React.ReactNode;
  tone?: 'solid' | 'cream';
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        'group inline-flex min-h-14 items-center gap-4 rounded-full py-2 pl-7 pr-2 font-heading text-base font-semibold no-underline! transition-[transform,box-shadow,background-color] duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:min-h-16 sm:gap-5 sm:pl-8 sm:text-lg',
        tone === 'solid'
          ? 'bg-primary text-white shadow-[0_12px_28px_-10px_rgba(169,83,14,0.55)] hover:bg-[#8f440b] hover:shadow-[0_20px_38px_-12px_rgba(169,83,14,0.7)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e8cba6]'
          : 'bg-[#faf4ec] text-[#2e1c12] shadow-[0_12px_28px_-12px_rgba(0,0,0,0.55)] hover:bg-white hover:shadow-[0_20px_38px_-14px_rgba(0,0,0,0.6)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e8cba6]',
        className,
      )}
    >
      {children}
      <span
        className={cn(
          'relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full sm:size-12',
          tone === 'solid' ? 'bg-white text-primary' : 'bg-primary text-white',
        )}
      >
        <ArrowRightIcon className="size-5 transition-transform duration-300 motion-safe:group-hover:translate-x-[220%]" />
        <ArrowRightIcon className="absolute size-5 -translate-x-[220%] transition-transform duration-300 motion-safe:group-hover:translate-x-0" />
      </span>
    </a>
  );
}
