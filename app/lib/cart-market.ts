import type {CartQueryDataReturn, HydrogenCart} from '@shopify/hydrogen';
import type {CountryCode} from '@shopify/hydrogen/storefront-api-types';

/**
 * The cart carries its own market.
 *
 * `@inContext` decides the currency of everything a shopper *browses*, but the
 * cart's `buyerIdentity.countryCode` is what travels to checkout — they are
 * separate values, and a cart created before a market switch keeps whatever
 * country it was born with. Left unsynced, a shopper browses in CAD and pays in
 * USD, which is worse than never offering CAD at all.
 */

/** Just enough of the cart's shape to decide whether a sync is needed. */
type CartSnapshot =
  | {
      id?: string | null;
      buyerIdentity?: {countryCode?: CountryCode | null} | null;
    }
  | null
  | undefined;

export async function syncCartBuyerIdentity({
  cart,
  country,
  snapshot,
}: {
  cart: HydrogenCart;
  country: CountryCode;
  /**
   * The caller's already-fetched cart. Pass it wherever one is in hand — add to
   * cart is the hottest path in the store and does not deserve a second round
   * trip. Omit it only when no cart has been fetched yet.
   */
  snapshot?: CartSnapshot;
}): Promise<CartQueryDataReturn | null> {
  // Without a snapshot, decide from the cart cookie rather than fetching the
  // cart to compare. `getCartId` is a cookie read; `get` is a full round trip,
  // and it would cost ~400ms to learn something the caller already implies —
  // the only caller here is the market switch, where the cart is by definition
  // in the market the shopper just left.
  if (snapshot === undefined) {
    return cart.getCartId()
      ? cart.updateBuyerIdentity({countryCode: country})
      : null;
  }

  // No cart yet: nothing to carry, and creating one here would be a surprise.
  if (!snapshot?.id) return null;
  if (snapshot.buyerIdentity?.countryCode === country) return null;

  return cart.updateBuyerIdentity({countryCode: country});
}
