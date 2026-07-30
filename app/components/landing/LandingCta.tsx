import {Link} from 'react-router';
import {ArrowRightIcon} from '~/components/icons';
import {cn} from '~/lib/utils';

/**
 * The primary call to action on a paid landing page: a pill with a disc on the
 * end, in the landing palette's cognac. Two arrows chase each other through the
 * disc on hover so it never renders empty mid-transition.
 *
 * `href` decides the element. A `#fragment` renders a plain anchor, so the
 * in-page jump works before hydration — landing pages are read in the TikTok
 * and Instagram browsers, often on a slow connection, and a CTA that needs
 * JavaScript to scroll is a CTA that does nothing for the first second. Any
 * other value renders a router `Link` with intent prefetching.
 */
export function LandingCta({
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
  const classes = cn(
    'group inline-flex min-h-14 items-center gap-4 rounded-full py-2 pl-7 pr-2 font-heading text-base font-semibold no-underline! transition-[transform,box-shadow,background-color] duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:min-h-16 sm:gap-5 sm:pl-8 sm:text-lg',
    tone === 'solid'
      ? 'bg-primary text-white shadow-[0_12px_28px_-10px_rgba(169,83,14,0.55)] hover:bg-[#8f440b] hover:shadow-[0_20px_38px_-12px_rgba(169,83,14,0.7)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e8cba6]'
      : 'bg-[#faf4ec] text-[#2e1c12] shadow-[0_12px_28px_-12px_rgba(0,0,0,0.55)] hover:bg-white hover:shadow-[0_20px_38px_-14px_rgba(0,0,0,0.6)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e8cba6]',
    className,
  );

  const inner = (
    <>
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
    </>
  );

  if (href.startsWith('#')) {
    return (
      <a href={href} className={classes}>
        {inner}
      </a>
    );
  }

  return (
    <Link to={href} prefetch="intent" className={classes}>
      {inner}
    </Link>
  );
}
