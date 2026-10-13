import {useEffect, useRef, useState, type RefObject} from 'react';
import {NavLink, useLocation} from 'react-router';
import type {HeaderQuery} from 'storefrontapi.generated';
import logo from '~/assets/img-logo.png';
import {useAside} from '~/components/Aside';
import {CountrySelector} from '~/components/CountrySelector';
import {cn} from '~/lib/utils';
import {ArrowRightIcon, MenuIcon, UserIcon} from '~/components/icons';

interface HeaderProps {
  header: HeaderQuery;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
}

type Viewport = 'desktop' | 'mobile';

/** Which coat the bar wears — see `.liquid-glass-header` in `app.css`. */
export type HeaderTone = 'light' | 'dark';

const TONE = {
  light: {
    wordmark: 'text-[#004817]',
    link: 'text-[#00521d] hover:bg-[#effce9] hover:text-[#003e15] focus-visible:outline-[#00521d]',
    activeLink: 'text-[#003e15]',
    // The fill has to carry the shape on its own: `#effce9` disappears into
    // the white glass, so the controls sit a step deeper on the brand ramp.
    pill: 'bg-[#c3edc0] text-[#004817] hover:bg-[#a4e8aa] focus-visible:outline-[#00521d]',
  },
  dark: {
    wordmark: 'text-[#f3fff1]',
    link: 'text-[#d9f7d5] hover:bg-white/10 hover:text-white focus-visible:outline-[#a4e8aa]',
    activeLink: 'text-white',
    pill: 'bg-white/12 text-[#d9f7d5] hover:bg-white/20 hover:text-white focus-visible:outline-[#a4e8aa]',
  },
} as const;

const pillClass =
  'inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-[background-color,color,scale,translate] duration-300 ease-out hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-[0.96] motion-reduce:transition-none';

export function Header({header, publicStoreDomain}: HeaderProps) {
  const {shop, menu} = header;
  const {pathname} = useLocation();
  const isHome = pathname === '/';
  const headerRef = useRef<HTMLElement>(null);
  // The home hero is the first thing under the bar, so the server can already
  // render the right coat; scrolling refines it from there.
  const tone = useHeaderTone(headerRef, isHome ? 'dark' : 'light');
  const t = TONE[tone];

  return (
    <header
      ref={headerRef}
      data-tone={tone}
      className={cn(
        'liquid-glass-header sticky top-3 z-50 mx-auto mt-3 grid w-[calc(100%-1.5rem)] max-w-[90rem] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 p-2.5 lg:top-4 lg:mt-4 lg:w-[calc(100%-2rem)] lg:gap-4 lg:p-2 lg:pl-5',
        isHome ? '-mb-20' : 'mb-3 lg:mb-4',
      )}
    >
      <HeaderMenuMobileToggle tone={tone} />
      <NavLink
        prefetch="intent"
        to="/"
        end
        aria-label={`${shop.name} home`}
        className="group/brand flex shrink-0 items-center gap-1.5 justify-self-center rounded-full px-1 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-current lg:justify-self-start lg:px-0"
      >
        <img
          src={logo}
          alt=""
          width="765"
          height="816"
          // A small wag on hover. The overshoot curve is what makes it read as
          // a paw rather than an icon spinning.
          className="h-8 w-auto shrink-0 scale-80 rounded-none! transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-safe:group-hover/brand:-rotate-12 motion-reduce:transition-none lg:h-9"
        />
        {/* Same cut as the page headings: heavy Figtree, tight tracking. */}
        <span
          className={cn(
            'font-heading text-[1.375rem] font-bold leading-none tracking-[-0.05em] transition-colors duration-300 ease-out motion-reduce:transition-none lg:text-2xl',
            t.wordmark,
          )}
        >
          {shop.name}
        </span>
      </NavLink>
      <HeaderMenu
        menu={menu}
        viewport="desktop"
        tone={tone}
        primaryDomainUrl={header.shop.primaryDomain.url}
        publicStoreDomain={publicStoreDomain}
      />
      <HeaderCtas tone={tone} />
    </header>
  );
}

/**
 * Which surface is under the bar right now. Any element marked
 * `data-header-tone="dark"` turns the bar to its dark coat while it sits behind
 * the bar's midline, so the header matches the hero at the top of the home page
 * and the footer at the bottom of every page, and is white glass in between.
 *
 * The reading is keyed by pathname: after a client-side navigation the old
 * page's reading is ignored and `fallback` stands in until the first
 * measurement, so a light bar never flashes over the hero.
 */
function useHeaderTone(
  headerRef: RefObject<HTMLElement>,
  fallback: HeaderTone,
): HeaderTone {
  const {pathname} = useLocation();
  const [reading, setReading] = useState<{
    pathname: string;
    tone: HeaderTone;
  }>();

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const {top, bottom} = header.getBoundingClientRect();
      const midline = (top + bottom) / 2;
      const dark = Array.from(
        document.querySelectorAll('[data-header-tone="dark"]'),
      ).some((band) => {
        const rect = band.getBoundingClientRect();
        return rect.top <= midline && rect.bottom > midline;
      });
      const tone: HeaderTone = dark ? 'dark' : 'light';
      // Same object back when nothing changed, so scrolling doesn't re-render.
      setReading((prev) =>
        prev?.pathname === pathname && prev.tone === tone
          ? prev
          : {pathname, tone},
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', schedule, {passive: true});
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [headerRef, pathname]);

  return reading?.pathname === pathname ? reading.tone : fallback;
}

export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  tone = 'light',
  publicStoreDomain,
}: {
  menu: HeaderProps['header']['menu'];
  primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
  viewport: Viewport;
  tone?: HeaderTone;
  publicStoreDomain: HeaderProps['publicStoreDomain'];
}) {
  const {close} = useAside();

  const items = [
    {id: 'home', title: 'Home', to: '/'},
    {id: 'shop', title: 'Shop', to: '/shop'},
  ];
  for (const item of (menu || FALLBACK_HEADER_MENU).items) {
    if (!item.url) continue;

    // if the url is internal, we strip the domain
    const url =
      item.url.includes('myshopify.com') ||
      item.url.includes(publicStoreDomain) ||
      item.url.includes(primaryDomainUrl)
        ? new URL(item.url).pathname
        : item.url;
    // Skip menu items we already render explicitly above (Home, Shop).
    const menuTitle = item.title.trim().toLowerCase();
    if (
      url === '/' ||
      url === '' ||
      url === '/shop' ||
      menuTitle === 'home' ||
      menuTitle === 'shop'
    )
      continue;
    items.push({id: item.id, title: item.title, to: url});
  }

  if (viewport === 'mobile') {
    return (
      <nav className="flex flex-col px-6 pt-2" aria-label="Primary">
        {items.map(({id, title, to}) => (
          <NavLink
            key={id}
            end
            onClick={close}
            prefetch="intent"
            to={to}
            className="group/row flex min-h-16 items-center justify-between gap-4 border-b border-[#00521d]/10 font-heading text-[1.75rem] font-semibold leading-none tracking-[-0.045em] text-[#00521d] hover:no-underline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#00521d]"
          >
            {({isActive}) => (
              <>
                <span className="relative">
                  {title}
                  {isActive && (
                    <Squiggle className="-bottom-2 left-0 h-2 w-full" />
                  )}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'grid size-9 place-items-center rounded-full transition-[background-color,color,translate] duration-300 ease-out motion-safe:group-hover/row:translate-x-0.5 motion-reduce:transition-none',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-[#effce9] text-[#00521d] group-hover/row:bg-[#c3edc0]',
                  )}
                >
                  <ArrowRightIcon className="size-4" />
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    );
  }

  return (
    <nav
      className="hidden items-center gap-[clamp(0.25rem,1vw,1rem)] lg:flex"
      aria-label="Primary"
    >
      {items.map(({id, title, to}) => (
        <NavLink
          key={id}
          end
          onClick={close}
          prefetch="intent"
          to={to}
          // Every link is semibold, current or not, so moving between pages
          // never reflows the row. The squiggle alone says "you are here".
          className={({isActive}) =>
            cn(
              'relative whitespace-nowrap rounded-full px-4 py-3 text-[0.9375rem] font-semibold leading-none tracking-[-0.01em] transition-colors duration-300 ease-out hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none',
              TONE[tone].link,
              isActive && TONE[tone].activeLink,
            )
          }
        >
          {({isActive}) => (
            <>
              {title}
              {isActive && (
                // An absolutely positioned <svg> is a replaced element:
                // left + right won't stretch it, so it takes an explicit width.
                <Squiggle className="bottom-[0.3rem] left-4 h-1.5 w-[calc(100%-2rem)]" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

/** The hero headline's orange underline, at nav size. */
function Squiggle({className}: {className?: string}) {
  return (
    <svg
      viewBox="0 0 200 12"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
      className={cn(
        'header-squiggle pointer-events-none absolute text-primary',
        className,
      )}
    >
      <path
        d="M2 8c22-6 44-6 66-1s44 5 66 0 44-5 64 0"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function HeaderCtas({tone}: {tone: HeaderTone}) {
  return (
    <nav
      className="flex items-center justify-self-end gap-2 lg:gap-2.5"
      aria-label="Account actions"
    >
      {/*
        Desktop only — the mobile bar is already toggle, logo, and account, and
        a fourth control crowds it. Mobile reaches the switcher through the menu
        aside instead (see `PageLayout`).
      */}
      <CountrySelector tone={tone} className="hidden lg:inline-flex" />
      <AccountLink tone={tone} />
    </nav>
  );
}

function AccountLink({tone}: {tone: HeaderTone}) {
  return (
    <NavLink
      prefetch="intent"
      to="/account"
      // Was a solid dark-green disc — the heaviest thing in the header for its
      // least-used action, and it fought the currency control beside it. The
      // shared light pill puts it in the same family as the menu toggle.
      className={cn(pillClass, TONE[tone].pill)}
      aria-label="Account"
    >
      <UserIcon className="size-[1.375rem]" />
    </NavLink>
  );
}

function HeaderMenuMobileToggle({tone}: {tone: HeaderTone}) {
  const {open} = useAside();
  return (
    <button
      type="button"
      className={cn(pillClass, TONE[tone].pill, 'justify-self-start lg:hidden')}
      onClick={() => open('mobile')}
      aria-label="Open menu"
    >
      <MenuIcon className="size-6" />
    </button>
  );
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      resourceId: null,
      tags: [],
      title: 'Collections',
      type: 'HTTP',
      url: '/collections',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      resourceId: null,
      tags: [],
      title: 'Blog',
      type: 'HTTP',
      url: '/blogs/news',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      resourceId: null,
      tags: [],
      title: 'Policies',
      type: 'HTTP',
      url: '/policies',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      resourceId: null,
      tags: [],
      title: 'About',
      type: 'HTTP',
      url: '/about',
      items: [],
    },
  ],
};
