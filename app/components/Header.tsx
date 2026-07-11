import {Suspense} from 'react';
import {Await, NavLink, useAsyncValue, useLocation} from 'react-router';
import {
  type CartViewPayload,
  Money,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {HeaderQuery, CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {cn} from '~/lib/utils';
import {
  CartIcon,
  MenuIcon,
  PawIcon,
  SearchIcon,
  UserIcon,
} from '~/components/icons';

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
}

type Viewport = 'desktop' | 'mobile';

const pillClass =
  'inline-flex min-block-size-11 min-inline-size-11 items-center justify-center rounded-full bg-white text-[#004817] transition-transform hover:scale-[1.04] hover:no-underline! focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#00521d]';

function navLinkClass({
  isActive,
}: {
  isActive: boolean;
  isPending: boolean;
}) {
  return cn(
    'text-lg font-normal text-[#143b20] transition-colors hover:text-[#004817] hover:no-underline!',
    isActive && 'font-semibold text-[#004817]',
  );
}

export function Header({header, cart, publicStoreDomain}: HeaderProps) {
  const {shop, menu} = header;
  const {pathname} = useLocation();
  const isHome = pathname === '/';

  return (
    <header
      className={cn(
        'relative z-40 flex items-center justify-between gap-4 px-5',
        isHome
          ? 'min-h-20 bg-[#effce9] py-3 lg:min-h-24 lg:px-[3.5vw] lg:py-4'
          : 'min-h-20 bg-background py-3 lg:px-[3.5vw]',
      )}
    >
      <HeaderMenuMobileToggle />
      <NavLink
        prefetch="intent"
        to="/"
        end
        className="hidden items-center gap-3 hover:no-underline! lg:flex"
      >
        <PawIcon className="size-9 text-primary" />
        <span className="font-heading text-[1.75rem] font-semibold tracking-[-0.04em] text-[#004817]">
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
    <nav className={className} role="navigation">
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
    <nav className="flex items-center gap-2.5 lg:gap-3" aria-label="Account actions">
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
      className={cn(pillClass, 'size-12 lg:size-14')}
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
      className={cn(pillClass, 'size-12 lg:hidden')}
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
      className={cn(pillClass, 'hidden size-14 lg:inline-flex')}
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
    | Partial<CartApiQueryFragment['cost']['subtotalAmount']>
    | null
    | undefined;
}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

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
        'h-12 gap-1.5 px-3 lg:h-14 lg:gap-2 lg:pl-3 lg:pr-5',
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
      {subtotal?.amount ? (
        <Money
          data={subtotal}
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
