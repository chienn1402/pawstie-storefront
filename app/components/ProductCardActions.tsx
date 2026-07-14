import {useEffect, useRef} from 'react';
import {Link, useFetchers} from 'react-router';
import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';
import type {FetcherWithComponents} from 'react-router';
import type {RecommendedProductFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {BoltIcon, CartIcon} from '~/components/icons';
import {useVariantUrl} from '~/lib/variants';

type CardVariant = NonNullable<
  RecommendedProductFragment['selectedOrFirstAvailableVariant']
>;

// The cluster opts everything out of hit-testing by default (photo behind it
// stays clickable through the gap and through Hydrogen's generated <form>
// wrappers); only genuine controls opt back in with pointer-events-auto.
const CLUSTER =
  'pointer-events-none absolute bottom-3 right-3 z-10 flex items-center gap-2';

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00521d] focus-visible:ring-2 focus-visible:ring-white';

const ICON_BUTTON = `pointer-events-auto grid size-11 place-items-center rounded-full transition-[transform,background-color] duration-200 hover:scale-105 ${FOCUS_RING} disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:scale-100`;

const PILL =
  'inline-flex min-h-11 items-center rounded-full bg-white px-4 font-heading text-sm font-semibold text-[#00521d] shadow-sm';

function cartLines(variant: CardVariant): Array<OptimisticCartLineInput> {
  return [{merchandiseId: variant.id, quantity: 1, selectedVariant: variant}];
}

function quickAddKey(productId: string) {
  return `quick-add-${productId}`;
}

function quickBuyKey(productId: string) {
  return `quick-buy-${productId}`;
}

// Quick-add and quick-buy each keep their own fetcher (so one button's
// response can never drive the other's redirect), but the two buttons must
// still disable together: otherwise an in-flight quick-buy leaves quick-add
// clickable and a shopper can double-submit their way to checkout with the
// wrong quantity.
function useClusterBusy(productId: string) {
  const addKey = quickAddKey(productId);
  const buyKey = quickBuyKey(productId);
  return useFetchers().some(
    (fetcher) =>
      (fetcher.key === addKey || fetcher.key === buyKey) &&
      fetcher.state !== 'idle',
  );
}

function QuickAddButton({
  variant,
  title,
  productId,
  busy,
}: {
  variant: CardVariant;
  title: string;
  productId: string;
  busy: boolean;
}) {
  const {open} = useAside();

  return (
    <CartForm
      route="/cart"
      fetcherKey={quickAddKey(productId)}
      inputs={{lines: cartLines(variant)}}
      action={CartForm.ACTIONS.LinesAdd}
    >
      {() => (
        <button
          type="submit"
          onClick={() => open('cart')}
          disabled={busy}
          aria-label={`Add ${title} to cart`}
          className={`${ICON_BUTTON} bg-[#effce9] text-[#00521d] ring-1 ring-[#d6f3d0] hover:bg-white`}
        >
          <CartIcon className="size-5" />
        </button>
      )}
    </CartForm>
  );
}

function QuickBuyControl({
  fetcher,
  title,
  busy,
}: {
  fetcher: FetcherWithComponents<any>;
  title: string;
  busy: boolean;
}) {
  const {open} = useAside();

  // Set on submit so a `fetcher.data` left over from an earlier render can
  // never fire a redirect the shopper did not ask for.
  const awaitingCheckout = useRef(false);

  useEffect(() => {
    if (fetcher.state === 'submitting') {
      awaitingCheckout.current = true;
      return;
    }
    if (fetcher.state !== 'idle' || !awaitingCheckout.current) return;

    awaitingCheckout.current = false;

    // A LinesAdd userError (sold out since page load, inventory limit,
    // market restriction) returns the cart UNCHANGED alongside `errors`.
    // Redirecting on that response would send the shopper to checkout
    // without the item they just clicked buy on, so surface the failure
    // via the cart drawer instead of navigating away.
    if (fetcher.data?.errors?.length) {
      open('cart');
      return;
    }

    const checkoutUrl = fetcher.data?.cart?.checkoutUrl;
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  }, [fetcher.state, fetcher.data, open]);

  return (
    <button
      type="submit"
      disabled={busy}
      aria-label={`Buy ${title} now`}
      className={`${ICON_BUTTON} bg-primary text-white hover:bg-[#8f440b]`}
    >
      <BoltIcon className="size-5" />
    </button>
  );
}

function QuickBuyButton({
  variant,
  title,
  productId,
  busy,
}: {
  variant: CardVariant;
  title: string;
  productId: string;
  busy: boolean;
}) {
  return (
    <CartForm
      route="/cart"
      fetcherKey={quickBuyKey(productId)}
      inputs={{lines: cartLines(variant)}}
      action={CartForm.ACTIONS.LinesAdd}
    >
      {(fetcher: FetcherWithComponents<any>) => (
        <QuickBuyControl fetcher={fetcher} title={title} busy={busy} />
      )}
    </CartForm>
  );
}

export function ProductCardActions({
  product,
}: {
  product: RecommendedProductFragment;
}) {
  const variantUrl = useVariantUrl(product.handle);
  const variant = product.selectedOrFirstAvailableVariant;
  const hasChoices = product.options.some(
    (option) => option.optionValues.length > 1,
  );
  const busy = useClusterBusy(product.id);

  if (hasChoices) {
    return (
      <div className={CLUSTER}>
        <Link
          to={variantUrl}
          prefetch="intent"
          className={`${PILL} pointer-events-auto transition-transform duration-200 hover:scale-105 hover:no-underline ${FOCUS_RING} motion-reduce:transition-none motion-reduce:hover:scale-100`}
        >
          Choose options
        </Link>
      </div>
    );
  }

  if (!variant || !variant.availableForSale) {
    return (
      <div className={CLUSTER}>
        <span className={`${PILL} text-[#347345]`}>Sold out</span>
      </div>
    );
  }

  return (
    <div className={CLUSTER}>
      <QuickAddButton
        variant={variant}
        title={product.title}
        productId={product.id}
        busy={busy}
      />
      <QuickBuyButton
        variant={variant}
        title={product.title}
        productId={product.id}
        busy={busy}
      />
    </div>
  );
}
