import {Link} from 'react-router';
import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';
import type {RecommendedProductFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {ArrowRightIcon, PlusIcon} from '~/components/icons';
import {useVariantUrl} from '~/lib/variants';

type CardVariant = NonNullable<
  RecommendedProductFragment['selectedOrFirstAvailableVariant']
>;

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#00521d]';

const ACTION = `inline-flex min-h-12 items-center gap-2 rounded-sm py-2 font-heading text-sm font-semibold text-[#00521d] underline-offset-4 transition-colors duration-200 hover:text-primary hover:underline ${FOCUS_RING} disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none`;

function cartLines(variant: CardVariant): Array<OptimisticCartLineInput> {
  return [{merchandiseId: variant.id, quantity: 1, selectedVariant: variant}];
}

function quickAddKey(productId: string) {
  return `quick-add-${productId}`;
}

function AddToCartButton({
  variant,
  title,
  productId,
}: {
  variant: CardVariant;
  title: string;
  productId: string;
}) {
  const {open} = useAside();

  return (
    <CartForm
      route="/cart"
      fetcherKey={quickAddKey(productId)}
      inputs={{lines: cartLines(variant)}}
      action={CartForm.ACTIONS.LinesAdd}
    >
      {(fetcher) => {
        const busy = fetcher.state !== 'idle';

        return (
          <button
            type="submit"
            onClick={() => open('cart')}
            disabled={busy}
            className={ACTION}
          >
            <span>
              {busy ? 'Adding…' : 'Add to cart'}
              <span className="sr-only"> for {title}</span>
            </span>
            <PlusIcon className="size-4" />
          </button>
        );
      }}
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
      <div className="relative z-10 mt-auto pt-2">
        <Link to={variantUrl} prefetch="intent" className={ACTION}>
          <span>
            Choose options
            <span className="sr-only"> for {product.title}</span>
          </span>
          <ArrowRightIcon className="size-4" />
        </Link>
      </div>
    );
  }

  if (!variant || !variant.availableForSale) {
    return (
      <div className="relative z-10 mt-auto pt-2">
        <span className="inline-flex min-h-12 items-center py-2 font-heading text-sm font-semibold text-[#347345]">
          Sold out
        </span>
      </div>
    );
  }

  return (
    <div className="relative z-10 mt-auto pt-2">
      <AddToCartButton
        variant={variant}
        title={product.title}
        productId={product.id}
      />
    </div>
  );
}
