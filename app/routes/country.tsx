import {data, redirect} from 'react-router';
import type {Route} from './+types/country';
import {syncCartBuyerIdentity} from '~/lib/cart-market';
import {COUNTRY_SESSION_KEY, isSupportedCountry} from '~/lib/i18n';
import {safeRedirect} from '~/lib/safe-redirect';

/**
 * Records an explicit market choice from the footer switcher.
 *
 * Action-only: there is nothing to render at /country, so a GET is sent home.
 */
export async function loader() {
  return redirect('/');
}

export async function action({request, context}: Route.ActionArgs) {
  const formData = await request.formData();
  const country = String(formData.get('country') ?? '')
    .trim()
    .toUpperCase();

  // An unsupported value here means a broken form, not a shopper — say so
  // rather than silently dropping them into the default market.
  if (!isSupportedCountry(country)) {
    throw data(`Unsupported country: ${country || '(none)'}`, {status: 400});
  }

  const destination = safeRedirect(formData.get('redirectTo'));

  // Already here. Re-pricing the cart costs a Shopify round trip, so clicking
  // the active segment should cost nothing at all.
  if (country === context.storefront.i18n.country) {
    return redirect(destination, {status: 303});
  }

  context.session.set(COUNTRY_SESSION_KEY, country);

  // `context.storefront.i18n` still holds the *previous* market — the context
  // was built at the top of this request — so pass the new choice explicitly.
  //
  // This only ever updates an existing cart, whose id does not change, so it
  // emits no cookie of its own. That matters: `server.ts` commits the session
  // with `headers.set('Set-Cookie', …)`, which would clobber one.
  await syncCartBuyerIdentity({cart: context.cart, country});

  // 303 so the no-JS path lands back on the page it came from. With JS, React
  // Router follows this client-side and revalidates in place — root opts into
  // revalidation on any non-GET, so the header re-prices with everything else.
  return redirect(destination, {status: 303});
}
