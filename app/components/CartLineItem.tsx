import type {CartLineUpdateInput} from '@shopify/hydrogen/storefront-api-types';
import type {CartLayout, LineItemChildrenMap} from '~/components/CartMain';
import {
  CartForm,
  Image,
  Money,
  type OptimisticCartLine,
} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {Link} from 'react-router';
import {useAside} from './Aside';
import {cn} from '~/lib/utils';
import type {CartApiQueryFragment} from 'storefrontapi.generated';

export type CartLine = OptimisticCartLine<CartApiQueryFragment>;

/**
 * A single line item in the cart. It displays the product image, title, price.
 * It also provides controls to update the quantity or remove the line item.
 * If the line is a parent line that has child components (like warranties or gift wrapping), they are
 * rendered nested below the parent line.
 */
export function CartLineItem({
  layout,
  line,
  childrenMap,
}: {
  layout: CartLayout;
  line: CartLine;
  childrenMap: LineItemChildrenMap;
}) {
  const {id, merchandise, isOptimistic} = line;
  const {product, title, image, selectedOptions} = merchandise;
  const lineItemUrl = useVariantUrl(product.handle, selectedOptions);
  const {close} = useAside();
  const lineItemChildren = childrenMap[id];
  const childrenLabelId = `cart-line-children-${id}`;

  // Shopify emits {name: 'Title', value: 'Default Title'} for every product that
  // has no real variants. It is not an option the customer chose — never show it.
  const options = selectedOptions.filter(
    (option) => option.value !== 'Default Title',
  );

  return (
    <li
      className={cn(
        'list-none transition-opacity',
        isOptimistic && 'pointer-events-none opacity-60',
      )}
      key={id}
    >
      <div className="flex gap-3 rounded-[1.25rem] rounded-br-[2.5rem] bg-[#eaf7ea] p-3">
        {image && (
          <Image
            alt={title}
            aspectRatio="1/1"
            className="size-[62px] flex-none rounded-xl! bg-[#a4e8aa] object-cover"
            data={image}
            height={124}
            loading="lazy"
            sizes="62px"
            width={124}
          />
        )}

        <div className="min-w-0 flex-1">
          <Link
            className="font-heading text-sm font-bold leading-snug tracking-[-0.01em] text-[#004817] hover:text-[#00752d] hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00521d]"
            onClick={() => {
              if (layout === 'aside') {
                close();
              }
            }}
            prefetch="intent"
            to={lineItemUrl}
          >
            {product.title}
          </Link>

          {options.length > 0 && (
            <ul className="mt-1 flex list-none flex-wrap gap-x-2">
              {options.map((option) => (
                <li className="text-xs text-[#5c7060]" key={option.name}>
                  {option.name}: {option.value}
                </li>
              ))}
            </ul>
          )}

          {line?.cost?.totalAmount && (
            <p className="mt-1 font-heading text-sm font-extrabold text-primary">
              <Money as="span" data={line.cost.totalAmount} />
            </p>
          )}

          <CartLineQuantity line={line} />
        </div>
      </div>

      {lineItemChildren ? (
        <div>
          <p className="sr-only" id={childrenLabelId}>
            Line items with {product.title}
          </p>
          <ul
            aria-labelledby={childrenLabelId}
            className="mt-2 flex list-none flex-col gap-2 pl-6"
          >
            {lineItemChildren.map((childLine) => (
              <CartLineItem
                childrenMap={childrenMap}
                key={childLine.id}
                layout={layout}
                line={childLine}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
}

/**
 * Provides the controls to update the quantity of a line item in the cart.
 * These controls are disabled when the line item is new, and the server
 * hasn't yet responded that it was successfully added to the cart.
 */
function CartLineQuantity({line}: {line: CartLine}) {
  if (!line || typeof line?.quantity === 'undefined') return null;
  const {id: lineId, quantity, isOptimistic} = line;
  const prevQuantity = Number(Math.max(0, quantity - 1).toFixed(0));
  const nextQuantity = Number((quantity + 1).toFixed(0));

  return (
    <div className="mt-2.5 flex items-center gap-3">
      {/* CartForm renders a <form> around each button, so the forms are the flex
          items here — not the buttons. */}
      <div className="inline-flex items-center rounded-full border border-[#cbe0ce] bg-white">
        <CartLineUpdateButton lines={[{id: lineId, quantity: prevQuantity}]}>
          <button
            aria-label="Decrease quantity"
            className={STEPPER_BUTTON}
            disabled={quantity <= 1 || !!isOptimistic}
            name="decrease-quantity"
            value={prevQuantity}
          >
            <span aria-hidden>&#8722;</span>
          </button>
        </CartLineUpdateButton>

        <span className="w-6 text-center font-heading text-xs font-extrabold text-[#004817]">
          {quantity}
        </span>

        <CartLineUpdateButton lines={[{id: lineId, quantity: nextQuantity}]}>
          <button
            aria-label="Increase quantity"
            className={STEPPER_BUTTON}
            disabled={!!isOptimistic}
            name="increase-quantity"
            value={nextQuantity}
          >
            <span aria-hidden>&#43;</span>
          </button>
        </CartLineUpdateButton>
      </div>

      <CartLineRemoveButton disabled={!!isOptimistic} lineIds={[lineId]} />
    </div>
  );
}

const STEPPER_BUTTON =
  'grid size-7 place-items-center rounded-full text-base font-bold leading-none text-[#00521d] transition-colors hover:bg-[#eaf7ea] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#00521d] disabled:opacity-35 disabled:hover:bg-transparent';

/**
 * A button that removes a line item from the cart. It is disabled
 * when the line item is new, and the server hasn't yet responded
 * that it was successfully added to the cart.
 */
function CartLineRemoveButton({
  lineIds,
  disabled,
}: {
  lineIds: string[];
  disabled: boolean;
}) {
  return (
    <CartForm
      action={CartForm.ACTIONS.LinesRemove}
      fetcherKey={getUpdateKey(lineIds)}
      inputs={{lineIds}}
      route="/cart"
    >
      <button
        className="text-xs font-semibold text-[#6d8070] underline underline-offset-2 transition-colors hover:text-[#00521d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00521d] disabled:opacity-40"
        disabled={disabled}
        type="submit"
      >
        Remove
      </button>
    </CartForm>
  );
}

function CartLineUpdateButton({
  children,
  lines,
}: {
  children: React.ReactNode;
  lines: CartLineUpdateInput[];
}) {
  const lineIds = lines.map((line) => line.id);

  return (
    <CartForm
      action={CartForm.ACTIONS.LinesUpdate}
      fetcherKey={getUpdateKey(lineIds)}
      inputs={{lines}}
      route="/cart"
    >
      {children}
    </CartForm>
  );
}

/**
 * Returns a unique key for the update action. This is used to make sure actions modifying the same line
 * items are not run concurrently, but cancel each other. For example, if the user clicks "Increase quantity"
 * and "Decrease quantity" in rapid succession, the actions will cancel each other and only the last one will run.
 * @param lineIds - line ids affected by the update
 * @returns
 */
function getUpdateKey(lineIds: string[]) {
  return [CartForm.ACTIONS.LinesUpdate, ...lineIds].join('-');
}
