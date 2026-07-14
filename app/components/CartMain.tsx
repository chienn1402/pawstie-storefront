import {useOptimisticCart} from '@shopify/hydrogen';
import {useId} from 'react';
import {Link} from 'react-router';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {CartLineItem, type CartLine} from '~/components/CartLineItem';
import {PawIcon} from '~/components/icons';
import {cn} from '~/lib/utils';
import {CartSummary} from './CartSummary';

export type CartLayout = 'page' | 'aside';

export type CartMainProps = {
  cart: CartApiQueryFragment | null;
  layout: CartLayout;
};

export type LineItemChildrenMap = {[parentId: string]: CartLine[]};
/** Returns a map of all line items and their children. */
function getLineItemChildrenMap(lines: CartLine[]): LineItemChildrenMap {
  const children: LineItemChildrenMap = {};
  for (const line of lines) {
    if ('parentRelationship' in line && line.parentRelationship?.parent) {
      const parentId = line.parentRelationship.parent.id;
      if (!children[parentId]) children[parentId] = [];
      children[parentId].push(line);
    }
    if ('lineComponents' in line) {
      const lineChildren = getLineItemChildrenMap(line.lineComponents);
      for (const [parentId, childIds] of Object.entries(lineChildren)) {
        if (!children[parentId]) children[parentId] = [];
        children[parentId].push(...childIds);
      }
    }
  }
  return children;
}
/**
 * The main cart component that displays the cart items and summary.
 * It is used by both the /cart route and the cart aside dialog.
 */
export function CartMain({layout, cart: originalCart}: CartMainProps) {
  // The useOptimisticCart hook applies pending actions to the cart
  // so the user immediately sees feedback when they modify the cart.
  const cart = useOptimisticCart(originalCart);
  const linesId = useId();
  const isAside = layout === 'aside';

  const lines = cart?.lines?.nodes ?? [];
  const childrenMap = getLineItemChildrenMap(lines);

  if (lines.length === 0) {
    return <CartEmpty />;
  }

  return (
    <section
      aria-label={isAside ? 'Cart drawer' : 'Cart page'}
      className={cn(isAside && 'flex min-h-0 flex-1 flex-col p-0')}
    >
      <p className="sr-only" id={linesId}>
        Line items
      </p>
      <ul
        aria-labelledby={linesId}
        className={cn(
          'flex list-none flex-col gap-3',
          isAside && 'min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2',
        )}
      >
        {lines.map((line) => {
          // we do not render non-parent lines at the root of the cart
          if ('parentRelationship' in line && line.parentRelationship?.parent) {
            return null;
          }
          return (
            <CartLineItem
              childrenMap={childrenMap}
              key={line.id}
              layout={layout}
              line={line}
            />
          );
        })}
      </ul>
      <CartSummary cart={cart} layout={layout} />
    </section>
  );
}

function CartEmpty() {
  const {close} = useAside();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 pb-16 text-center">
      <div className="grid size-20 place-items-center rounded-full bg-[#a4e8aa]">
        <PawIcon className="size-9 text-[#00521d]" />
      </div>
      <h3 className="mt-5 font-heading text-lg font-extrabold tracking-[-0.02em] text-[#004817]">
        Your cart is empty
      </h3>
      <p className="mt-1.5 text-sm text-[#5c7060]">
        Nothing here yet — let&rsquo;s find something your pet will love.
      </p>
      <Link
        className="mt-6 rounded-full bg-primary px-6 py-3 font-heading text-sm font-extrabold text-primary-foreground no-underline transition-colors hover:bg-primary/90 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00521d]"
        onClick={close}
        prefetch="viewport"
        to="/collections"
      >
        Start shopping
      </Link>
    </div>
  );
}
