import {Link} from 'react-router';
import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';
import type {FetcherWithComponents} from 'react-router';
import type {RecommendedProductFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {CartIcon} from '~/components/icons';
import {useVariantUrl} from '~/lib/variants';

type CardVariant = NonNullable<
  RecommendedProductFragment['selectedOrFirstAvailableVariant']
>;

const CLUSTER = 'absolute bottom-3 right-3 z-10 flex items-center gap-2';

const ICON_BUTTON =
  'grid size-11 place-items-center rounded-full transition-[transform,background-color] duration-200 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:scale-100';

const PILL =
  'inline-flex min-h-11 items-center rounded-full bg-white px-4 font-heading text-sm font-semibold text-[#00521d] shadow-sm';

function cartLines(variant: CardVariant): Array<OptimisticCartLineInput> {
  return [{merchandiseId: variant.id, quantity: 1, selectedVariant: variant}];
}

function QuickAddButton({
  variant,
  title,
}: {
  variant: CardVariant;
  title: string;
}) {
  const {open} = useAside();

  return (
    <CartForm
      route="/cart"
      inputs={{lines: cartLines(variant)}}
      action={CartForm.ACTIONS.LinesAdd}
    >
      {(fetcher: FetcherWithComponents<any>) => (
        <button
          type="submit"
          onClick={() => open('cart')}
          disabled={fetcher.state !== 'idle'}
          aria-label={`Add ${title} to cart`}
          className={`${ICON_BUTTON} bg-[#effce9] text-[#00521d] ring-1 ring-[#d6f3d0] hover:bg-white`}
        >
          <CartIcon className="size-5" />
        </button>
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

  if (hasChoices) {
    return (
      <div className={CLUSTER}>
        <Link
          to={variantUrl}
          prefetch="intent"
          className={`${PILL} transition-transform duration-200 hover:scale-105 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none motion-reduce:hover:scale-100`}
        >
          Choose options
        </Link>
      </div>
    );
  }

  if (!variant || !variant.availableForSale) {
    return (
      <div className={CLUSTER}>
        <span className={`${PILL} text-[#347345] pointer-events-none`}>Sold out</span>
      </div>
    );
  }

  return (
    <div className={CLUSTER}>
      <QuickAddButton variant={variant} title={product.title} />
    </div>
  );
}
