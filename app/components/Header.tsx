import {Suspense} from 'react';
import {Await, NavLink, useAsyncValue, useLocation} from 'react-router';
import {
  type CartViewPayload,
  Money,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {HeaderQuery, CartApiQueryFragment} from 'storefrontapi.generated';
import logo from '~/assets/img-logo.png';
import {useAside} from '~/components/Aside';
import {cn} from '~/lib/utils';
import {CartIcon, MenuIcon, SearchIcon, UserIcon} from '~/components/icons';

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
}

type Viewport = 'desktop' | 'mobile';

const pillClass =
  'inline-flex min-block-size-11 min-inline-size-11 items-center justify-center rounded-full bg-[#effce9] text-[#004817] transition-[background-color,color,box-shadow,scale,translate] duration-300 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.03] motion-safe:active:translate-y-0 motion-safe:active:scale-[0.98] hover:bg-[#e2f8dd] hover:shadow-sm hover:no-underline! focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#00521d] motion-reduce:transition-none';

function navLinkClass({isActive}: {isActive: boolean; isPending: boolean}) {
  return cn(
    'text-base! font-normal text-[#00521d]! transition-colors duration-300 ease-out hover:text-[#00752d]! hover:no-underline! motion-reduce:transition-none',
    isActive && 'font-semibold',
  );
}

export function Header({header, cart, publicStoreDomain}: HeaderProps) {
  const {shop, menu} = header;
  const {pathname} = useLocation();
  const isHome = pathname === '/';

  return (
    <header
      className={cn(
        'liquid-glass-header sticky top-3 z-50 mx-auto mt-3 grid w-[calc(100%-1.5rem)] max-w-[90rem] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2.5 p-2.5 lg:top-4 lg:mt-4 lg:w-[calc(100%-2rem)] lg:gap-4 lg:p-2 lg:px-3',
        isHome ? '-mb-20' : 'mb-3 lg:mb-4',
      )}
    >
      <HeaderMenuMobileToggle />
      <NavLink
        prefetch="intent"
        to="/"
        end
        aria-label={`${shop.name} home`}
        className="flex shrink-0 items-center gap-1! rounded-full px-1 transition-[color,scale] duration-300 ease-out motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98] hover:no-underline! focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#00521d] motion-reduce:transition-none lg:justify-self-start lg:gap-2 lg:px-0"
      >
        <img
          src={logo}
          alt=""
          width="164"
          height="179"
          className="h-8 w-auto shrink-0 scale-80 -rotate-20 rounded-none! lg:h-9 hidden md:inline-block"
        />
        <span className="font-heading text-xl! font-normal tracking-[-0.04em] text-[#004817]">
          {shop.name}
        </span>
      </NavLink>
      <HeaderMenu
        menu={menu}
        viewport="desktop"
        primaryDomainUrl={header.shop.primaryDomain.url}
        publicStoreDomain={publicStoreDomain}
      />
      <HeaderCtas cart={cart} />
    </header>
  );
}

export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
}: {
  menu: HeaderProps['header']['menu'];
  primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
  viewport: Viewport;
  publicStoreDomain: HeaderProps['publicStoreDomain'];
}) {
  const {close} = useAside();
  const className =
    viewport === 'desktop'
      ? 'hidden items-center gap-[clamp(1.75rem,3vw,4.5rem)] lg:flex'
      : 'flex flex-col gap-4 p-6 text-lg';

  return (
    <nav className={className} aria-label="Primary">
      <NavLink
        end
        onClick={close}
        prefetch="intent"
        className={navLinkClass}
        to="/"
      >
        Home
      </NavLink>
      {(menu || FALLBACK_HEADER_MENU).items.map((item) => {
        if (!item.url) return null;

        // if the url is internal, we strip the domain
        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;
        // Skip a menu "Home" item — we always render an explicit Home link above.
        if (
          url === '/' ||
          url === '' ||
          item.title.trim().toLowerCase() === 'home'
        )
          return null;
        return (
          <NavLink
            className={navLinkClass}
            end
            key={item.id}
            onClick={close}
            prefetch="intent"
            to={url}
          >
            {item.title}
          </NavLink>
        );
      })}
    </nav>
  );
}

function HeaderCtas({cart}: Pick<HeaderProps, 'cart'>) {
  return (
    <nav
      className="flex items-center justify-self-end gap-2 lg:gap-2.5"
      aria-label="Account actions"
    >
      <SearchToggle />
      <CartToggle cart={cart} />
      <AccountLink />
    </nav>
  );
}

function AccountLink() {
  return (
    <NavLink
      prefetch="intent"
      to="/account"
      className={cn(
        pillClass,
        'size-12 bg-[#00521d] text-white! hover:bg-[#006523]',
      )}
      aria-label="Account"
    >
      <UserIcon className="size-5" />
    </NavLink>
  );
}

function HeaderMenuMobileToggle() {
  const {open} = useAside();
  return (
    <button
      type="button"
      className={cn(pillClass, 'size-12 justify-self-start lg:hidden')}
      onClick={() => open('mobile')}
      aria-label="Open menu"
    >
      <MenuIcon className="size-6" />
    </button>
  );
}

function SearchToggle() {
  const {open} = useAside();
  return (
    <button
      type="button"
      className={cn(pillClass, 'hidden size-12 lg:inline-flex')}
      onClick={() => open('search')}
      aria-label="Search"
    >
      <SearchIcon className="size-6" />
    </button>
  );
}

function CartBadge({
  count,
  subtotal,
}: {
  count: number;
  subtotal:
    Partial<CartApiQueryFragment['cost']['subtotalAmount']> | null | undefined;
}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();
  const subtotalData = subtotal?.amount ? subtotal : null;
  const hasSubtotal = subtotalData !== null;

  return (
    <a
      href="/cart"
      onClick={(e) => {
        e.preventDefault();
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        } as CartViewPayload);
      }}
      className={cn(
        pillClass,
        hasSubtotal
          ? 'h-12 gap-1.5 px-3 lg:gap-2 lg:pr-4'
          : 'size-12 p-0',
      )}
      aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
    >
      <span className="relative grid size-7 place-items-center lg:size-8">
        <CartIcon className="size-5 lg:size-6" />
        {count > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 grid size-4 min-w-4 place-items-center rounded-full bg-[#00521d] px-1 text-[10px] font-bold leading-none text-white lg:size-5 lg:min-w-5 lg:text-xs">
            {count}
          </span>
        ) : null}
      </span>
      {subtotalData ? (
        <Money
          data={subtotalData}
          className="hidden text-base font-medium sm:inline lg:text-lg"
        />
      ) : null}
    </a>
  );
}

function CartToggle({cart}: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartBadge count={0} subtotal={null} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  return (
    <CartBadge
      count={cart?.totalQuantity ?? 0}
      subtotal={cart?.cost?.subtotalAmount ?? null}
    />
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
      url: '/blogs/journal',
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
      resourceId: 'gid://shopify/Page/92591030328',
      tags: [],
      title: 'About',
      type: 'PAGE',
      url: '/pages/about',
      items: [],
    },
  ],
};
