import type {
  CountryCode,
  LanguageCode,
} from '@shopify/hydrogen/storefront-api-types';

/**
 * Market resolution for the storefront.
 *
 * The shop has two active Shopify markets: United States (USD, the base
 * currency) and Canada (CAD). Neither market has its own catalog, so CAD is
 * Shopify's automatic conversion of the USD price — the market a request lands
 * in is therefore the only thing that decides the currency a shopper sees, and
 * it is decided here.
 *
 * Keep this module free of runtime imports and of the `~/` alias. It is loaded
 * directly by `scripts/market-detection.test.mjs` through Node's native type
 * stripping, which is what lets that test exercise the real resolver instead of
 * asserting on this file's source text.
 */

/**
 * Anything outside this set resolves to the US market — that is deliberate.
 * A GB or AU buyer paying USD is exactly what every visitor got before market
 * detection existed, so the fallback adds no new behavior.
 */
export const SUPPORTED_COUNTRIES = ['US', 'CA'] as const;

export type SupportedCountry = (typeof SUPPORTED_COUNTRIES)[number];

export const DEFAULT_COUNTRY: SupportedCountry = 'US';

/** Both markets are served in English; there is no second language. */
export const LANGUAGE: LanguageCode = 'EN';

/**
 * How each market is presented in the switcher. The currency is the market's
 * base currency in Admin — a label only, never used to format money. Prices
 * carry their own `currencyCode` from the Storefront API.
 */
export const MARKETS: Record<
  SupportedCountry,
  {label: string; currency: string}
> = {
  US: {label: 'United States', currency: 'USD'},
  CA: {label: 'Canada', currency: 'CAD'},
};

/** Where the footer selector stores an explicit shopper choice. */
export const COUNTRY_SESSION_KEY = 'country';

/**
 * Oxygen populates this from Cloudflare geo data. It is absent in local dev
 * (MiniOxygen never sets it) and can be absent in production when the lookup
 * fails, so it is never assumed present.
 */
const BUYER_COUNTRY_HEADER = 'oxygen-buyer-country';

/** The minimum surface `resolveCountry` needs; `AppSession` satisfies it. */
interface CountrySessionLike {
  get: (key: string) => unknown;
}

export function isSupportedCountry(value: unknown): value is SupportedCountry {
  return (
    typeof value === 'string' &&
    SUPPORTED_COUNTRIES.includes(value as SupportedCountry)
  );
}

function normalize(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim().toUpperCase() : undefined;
}

/**
 * Resolves the market for a request, in descending order of authority:
 *
 * 1. An explicit shopper choice held in the session — detection is a guess,
 *    and a guess must never outrank the shopper correcting it.
 * 2. The `oxygen-buyer-country` header.
 * 3. {@link DEFAULT_COUNTRY}.
 *
 * A stored value that is no longer supported falls through to detection rather
 * than winning, so a stale cookie cannot strand a buyer in the wrong currency.
 */
export function resolveCountry({
  request,
  session,
}: {
  request: Request;
  session: CountrySessionLike;
}): SupportedCountry {
  const chosen = normalize(session.get(COUNTRY_SESSION_KEY));
  if (isSupportedCountry(chosen)) return chosen;

  const detected = normalize(request.headers.get(BUYER_COUNTRY_HEADER));
  if (isSupportedCountry(detected)) return detected;

  return DEFAULT_COUNTRY;
}

/** The `i18n` value handed to `createHydrogenContext`. */
export function resolveI18n(options: {
  request: Request;
  session: CountrySessionLike;
}): {language: LanguageCode; country: CountryCode} {
  return {language: LANGUAGE, country: resolveCountry(options)};
}
