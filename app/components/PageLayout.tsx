import {Await, useAsyncValue} from 'react-router';
import {Suspense} from 'react';
import {useOptimisticCart} from '@shopify/hydrogen';
import type {
  CartApiQueryFragment,
  FooterQuery,
  HeaderQuery,
} from 'storefrontapi.generated';
import {Aside} from '~/components/Aside';
import {Footer} from '~/components/Footer';
import {Header, HeaderMenu} from '~/components/Header';
import {LandingFooter} from '~/components/LandingFooter';
import {LandingHeader} from '~/components/LandingHeader';
import {CartMain} from '~/components/CartMain';
import {CartFab} from '~/components/CartFab';
import {CountrySelector} from '~/components/CountrySelector';
import {useMinimalChrome} from '~/lib/chrome';

interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
  children?: React.ReactNode;
}

export function PageLayout({
  cart,
  children = null,
  footer,
  header,
  isLoggedIn,
  publicStoreDomain,
}: PageLayoutProps) {
  // Paid landing pages swap the store nav for logo-only chrome — see
  // `app/lib/chrome.ts` for why the exits are the point.
  const minimal = useMinimalChrome();

  return (
    <Aside.Provider>
      <a
        href="#main-content"
        className="absolute left-[-9999px] top-auto z-[100] rounded-full bg-[#00521d] px-5 py-3 font-semibold text-white shadow-lg focus:left-4 focus:top-4 focus:outline-2 focus:outline-offset-3 focus:outline-primary"
      >
        Skip to content
      </a>
      <CartAside cart={cart} />
      {/* No hamburger on landing pages, so nothing can open this aside. */}
      {!minimal && (
        <MobileMenuAside header={header} publicStoreDomain={publicStoreDomain} />
      )}
      {minimal ? (
        <LandingHeader shopName={header.shop.name} />
      ) : (
        header && (
          <Header
            header={header}
            isLoggedIn={isLoggedIn}
            publicStoreDomain={publicStoreDomain}
          />
        )
      )}
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      {minimal ? (
        <LandingFooter
          footer={footer}
          header={header}
          publicStoreDomain={publicStoreDomain}
        />
      ) : (
        <Footer
          footer={footer}
          header={header}
          publicStoreDomain={publicStoreDomain}
        />
      )}
      <CartFab cart={cart} />
    </Aside.Provider>
  );
}

function CartAside({cart}: {cart: PageLayoutProps['cart']}) {
  return (
    <Aside heading={<CartHeading cart={cart} />} type="cart">
      <Suspense fallback={<p className="px-5 text-sm text-[#5c7060]">Loading cart …</p>}>
        <Await resolve={cart}>
          {(cart) => <CartMain cart={cart} layout="aside" />}
        </Await>
      </Suspense>
    </Aside>
  );
}

function CartHeading({cart}: {cart: PageLayoutProps['cart']}) {
  return (
    <span className="block">
      Your cart
      <Suspense fallback={null}>
        {/* A rejected cart must not take the heading down — just show no count. */}
        <Await errorElement={<></>} resolve={cart}>
          <CartHeadingCount />
        </Await>
      </Suspense>
    </span>
  );
}

function CartHeadingCount() {
  const cart = useOptimisticCart(useAsyncValue() as CartApiQueryFragment | null);
  const count = cart?.totalQuantity ?? 0;

  if (count === 0) return null;

  return (
    <span className="mt-0.5 block font-sans text-xs font-bold text-[#4a6b4f]">
      {count} item{count === 1 ? '' : 's'}
    </span>
  );
}

function MobileMenuAside({
  header,
  publicStoreDomain,
}: {
  header: PageLayoutProps['header'];
  publicStoreDomain: PageLayoutProps['publicStoreDomain'];
}) {
  return (
    header.menu &&
    header.shop.primaryDomain?.url && (
      <Aside type="mobile" heading="MENU">
        <HeaderMenu
          menu={header.menu}
          viewport="mobile"
          primaryDomainUrl={header.shop.primaryDomain.url}
          publicStoreDomain={publicStoreDomain}
        />
        {/*
          The header hides the switcher below `lg`; this is its mobile home.
          The rule and eyebrow keep it from reading as one more nav link.
        */}
        <div className="mx-6 mt-2 border-t border-[#00521d]/10 pb-6 pt-5">
          <p className="mb-3 font-heading text-xs font-bold uppercase tracking-[0.16em] text-[#00521d]/55">
            Currency
          </p>
          <CountrySelector />
        </div>
      </Aside>
    )
  );
}
