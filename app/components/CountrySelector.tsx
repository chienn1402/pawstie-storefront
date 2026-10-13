import {
  Form,
  useLocation,
  useNavigation,
  useRouteLoaderData,
} from 'react-router';
import {MARKETS, SUPPORTED_COUNTRIES, isSupportedCountry} from '~/lib/i18n';
import type {HeaderTone} from '~/components/Header';
import {cn} from '~/lib/utils';
import type {RootLoader} from '~/root';

/**
 * Market switcher.
 *
 * Detection is a guess — a VPN, a corporate proxy, or a trip abroad all get it
 * wrong — so the shopper always keeps a way to correct it. Locally, where
 * Oxygen sets no geo header at all, this is the only route to the CAD market.
 *
 * Two markets means a segmented control rather than a <select>: current state
 * is visible without opening anything, and switching is one click. Each option
 * is its own submit button, so the whole thing works with no JavaScript and
 * needs no on-change navigation, which strands keyboard and screen-reader
 * users mid-list.
 */
export function CountrySelector({
  className,
  tone = 'light',
}: {
  className?: string;
  /** `dark` while the header floats over the home hero or the footer. */
  tone?: HeaderTone;
}) {
  const data = useRouteLoaderData<RootLoader>('root');
  const {pathname, search} = useLocation();
  const navigation = useNavigation();

  const current = isSupportedCountry(data?.country) ? data.country : undefined;

  // Re-pricing a cart and a page takes the better part of a second, so the
  // control answers first and the prices catch up. Scoped to this form's own
  // action — `useNavigation` is global, and any other form's submission would
  // otherwise move the chip.
  const inFlight =
    navigation.formAction === '/country'
      ? navigation.formData?.get('country')
      : undefined;
  const selected = isSupportedCountry(inFlight) ? inFlight : current;
  const busy = inFlight !== undefined;

  return (
    <Form
      method="post"
      action="/country"
      aria-label="Currency"
      aria-busy={busy || undefined}
      // The track carries its own edge through value alone — no outline. A step
      // deeper on the brand green is what separates it from the white glass.
      className={cn(
        'inline-flex h-11 items-center gap-0.5 rounded-full p-1 transition-colors duration-300 ease-out motion-reduce:transition-none',
        tone === 'dark' ? 'bg-white/12' : 'bg-[#c3edc0]',
        className,
      )}
    >
      <input type="hidden" name="redirectTo" value={`${pathname}${search}`} />
      {SUPPORTED_COUNTRIES.map((country) => {
        const {label, currency} = MARKETS[country];
        const active = country === selected;

        return (
          <button
            key={country}
            type="submit"
            name="country"
            value={country}
            // The set has a current member, which is what aria-current marks —
            // these are submit buttons, not toggles, so aria-pressed would lie.
            aria-current={active ? 'true' : undefined}
            aria-label={`Show prices in ${label} ${currency}`}
            className={cn(
              'h-9 rounded-full px-3 text-xs font-semibold tracking-[0.04em] transition-[background-color,color,box-shadow] duration-300 ease-out focus-visible:outline-2 focus-visible:outline-offset-3 motion-reduce:transition-none',
              // The one solid mark in the bar. It reads as "you are here"
              // rather than as a button because it sits inside the track — and
              // the account pill beside it is no longer solid to compete. On
              // the dark coat it inverts to sprout green on forest.
              tone === 'dark'
                ? active
                  ? 'bg-[#a4e8aa] text-[#003e15] focus-visible:outline-[#a4e8aa]'
                  : 'text-[#d9f7d5] hover:text-white focus-visible:outline-[#a4e8aa]'
                : active
                  ? 'bg-[#00521d] text-white shadow-[0_1px_2px_rgba(0,72,23,0.25)] focus-visible:outline-[#00521d]'
                  : 'text-[#00521d] hover:text-[#003a14] focus-visible:outline-[#00521d]',
            )}
          >
            {currency}
          </button>
        );
      })}
    </Form>
  );
}
