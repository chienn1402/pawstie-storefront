import {Suspense} from 'react';
import {Await, NavLink, useAsyncValue} from 'react-router';
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
  'inline-flex items-center justify-center rounded-full bg-[#eef7e9] text-[#1c4a25] transition-colors hover:bg-[#e2f0da]';

function navLinkClass({
  isActive,
}: {
  isActive: boolean;
  isPending: boolean;
}) {
  return cn(
    'font-medium text-[#1c4a25]/60 transition-colors hover:text-[#1c4a25]',
    isActive && 'font-bold text-[#1c4a25]',
  );
}

export function Header({header, cart, publicStoreDomain}: HeaderProps) {
  const {shop, menu} = header;
  return (
    <header className="flex items-center justify-between gap-4 bg-background px-4 py-3 sm:px-6 lg:px-10">
      <NavLink
        prefetch="intent"
        to="/"
        end
        className="flex items-center gap-2"
      >
        <PawIcon className="size-8 text-primary" />
        <span className="font-heading text-xl font-bold text-[#1c4a25]">
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
      ? 'hidden items-center gap-7 md:flex'
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
    <nav className="flex items-center gap-2 md:gap-3" role="navigation">
      <SearchToggle />
      <CartToggle cart={cart} />
      <AccountLink />
      <HeaderMenuMobileToggle />
    </nav>
  );
}

function AccountLink() {
  return (
    <NavLink
      prefetch="intent"
      to="/account"
      className={cn(pillClass, 'size-11')}
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
      className={cn(pillClass, 'size-11 md:hidden')}
      onClick={() => open('mobile')}
      aria-label="Open menu"
    >
      <MenuIcon className="size-5" />
    </button>
  );
}

function SearchToggle() {
  const {open} = useAside();
  return (
    <button
      className={cn(pillClass, 'size-11')}
      onClick={() => open('search')}
      aria-label="Search"
    >
      <SearchIcon className="size-5" />
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
      className={cn(pillClass, 'h-11 gap-2 pl-2 pr-4')}
      aria-label={`Cart, ${count} items`}
    >
      <span className="relative grid size-8 place-items-center">
        <CartIcon className="size-5" />
        <span className="absolute -right-1 -top-1 grid size-4 min-w-4 place-items-center rounded-full bg-[#14421e] px-1 text-[10px] font-bold leading-none text-white">
          {count}
        </span>
      </span>
      {subtotal ? (
        <Money data={subtotal} className="text-sm font-semibold" />
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
