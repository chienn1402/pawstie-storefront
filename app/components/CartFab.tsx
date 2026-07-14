import {Suspense} from 'react';
import {Await, useAsyncValue, useLocation} from 'react-router';
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {CartIcon} from '~/components/icons';

/**
 * Floating cart button, bottom-right on every route. Only rendered once the
 * cart holds at least one line — an empty cart has no button at all.
 */
export function CartFab({cart}: {cart: Promise<CartApiQueryFragment | null>}) {
  return (
    // No fallback: an empty button must not flash before the cart resolves.
    <Suspense fallback={null}>
      {/* A rejected cart promise must not take the page down — render no button.
          `errorElement={null}` would rethrow; an element is needed to swallow it. */}
      <Await resolve={cart} errorElement={<></>}>
        <CartFabButton />
      </Await>
    </Suspense>
  );
}

function CartFabButton() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  const count = cart?.totalQuantity ?? 0;

  const {open} = useAside();
  const {publish, shop, cart: analyticsCart, prevCart} = useAnalytics();
  const {pathname} = useLocation();

  if (count === 0 || pathname === '/cart') return null;

  // #00521d/#003e15 are *surface* colours here (hero, footer, product cards), so
  // a green button disappears into them. Orange separates it from the greens; the
  // white ring keeps its silhouette readable on any backdrop — including the
  // orange hero CTA it can overlap.
  return (
    <button
      type="button"
      onClick={() => {
        open('cart');
        publish('cart_viewed', {
          cart: analyticsCart,
          prevCart,
          shop,
          url: window.location.href || '',
        } as CartViewPayload);
      }}
      className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-[calc(1.5rem+env(safe-area-inset-right))] z-50 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground ring-4 ring-white shadow-lg shadow-black/30 transition-[background-color,box-shadow,scale,translate] duration-300 ease-out hover:bg-primary/90 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#00521d] motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-75 motion-safe:duration-300 motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.03] motion-safe:active:translate-y-0 motion-safe:active:scale-[0.98] motion-reduce:transition-none lg:bottom-[calc(2rem+env(safe-area-inset-bottom))] lg:right-[calc(2rem+env(safe-area-inset-right))]"
      aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
    >
      <CartIcon className="size-6" />
      <span className="absolute -right-1.5 -top-1.5 grid size-6 min-w-6 place-items-center rounded-full bg-[#00521d] px-1 text-xs font-bold leading-none text-white ring-2 ring-white">
        {count}
      </span>
    </button>
  );
}
