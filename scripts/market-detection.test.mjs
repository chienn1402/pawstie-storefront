import assert from 'node:assert/strict';
import {readdir, readFile} from 'node:fs/promises';
import test from 'node:test';
import {safeRedirect} from '../app/lib/safe-redirect.ts';
import {
  COUNTRY_SESSION_KEY,
  DEFAULT_COUNTRY,
  LANGUAGE,
  MARKETS,
  SUPPORTED_COUNTRIES,
  isSupportedCountry,
  resolveCountry,
  resolveI18n,
} from '../app/lib/i18n.ts';

// `app/lib/i18n.ts` is deliberately free of runtime Hydrogen imports and of the
// `~/` alias, so Node's native type stripping can load it and these tests can
// exercise the real resolver instead of asserting on its source text. Keep it
// that way: a runtime import here would force this file back to string matching.

const context = await readFile(
  new URL('../app/lib/context.ts', import.meta.url),
  'utf8',
);

const countryRoute = await readFile(
  new URL('../app/routes/country.tsx', import.meta.url),
  'utf8',
);

const cartRoute = await readFile(
  new URL('../app/routes/cart.tsx', import.meta.url),
  'utf8',
);

const routesDir = new URL('../app/routes/', import.meta.url);

/** Oxygen omits the header entirely when geo lookup fails; `null` models that. */
function requestWithCountry(country) {
  return new Request('https://pawstie.com/', {
    headers: country == null ? {} : {'oxygen-buyer-country': country},
  });
}

function sessionWithCountry(country) {
  return {get: (key) => (key === COUNTRY_SESSION_KEY ? country : undefined)};
}

const noSession = sessionWithCountry(undefined);

test('the supported market set matches the store: US and CA only', () => {
  assert.deepEqual([...SUPPORTED_COUNTRIES], ['US', 'CA']);
  assert.equal(DEFAULT_COUNTRY, 'US');
  assert.equal(LANGUAGE, 'EN');

  assert.ok(isSupportedCountry('US'));
  assert.ok(isSupportedCountry('CA'));
  for (const value of ['GB', 'AU', '', 'us', null, undefined, 42, {}]) {
    assert.ok(!isSupportedCountry(value), `should not support: ${value}`);
  }
});

test('an absent or unusable geo header falls back to the US market', () => {
  // Every one of these is today's behavior for a visitor with no market: USD.
  for (const header of [null, '', '   ', 'GB', 'AU', 'XX']) {
    assert.equal(
      resolveCountry({request: requestWithCountry(header), session: noSession}),
      'US',
      `expected US for header: ${JSON.stringify(header)}`,
    );
  }
});

test('a supported geo header selects that market, whatever its casing', () => {
  for (const header of ['CA', 'ca', 'Ca', ' ca ']) {
    assert.equal(
      resolveCountry({request: requestWithCountry(header), session: noSession}),
      'CA',
      `expected CA for header: ${JSON.stringify(header)}`,
    );
  }

  assert.equal(
    resolveCountry({request: requestWithCountry('US'), session: noSession}),
    'US',
  );
});

test('an explicit shopper choice outranks the geo header', () => {
  // A Canadian on a US IP, or anyone who simply prefers USD, must be able to
  // override detection — and locally there is no header to override at all.
  assert.equal(
    resolveCountry({
      request: requestWithCountry('US'),
      session: sessionWithCountry('CA'),
    }),
    'CA',
  );

  assert.equal(
    resolveCountry({
      request: requestWithCountry('CA'),
      session: sessionWithCountry('US'),
    }),
    'US',
  );

  assert.equal(
    resolveCountry({
      request: requestWithCountry(null),
      session: sessionWithCountry('CA'),
    }),
    'CA',
  );
});

test('an unusable session value falls through rather than overriding detection', () => {
  // A stale or tampered cookie must not strand a Canadian buyer in USD.
  for (const stored of ['GB', '', null, undefined, 42]) {
    assert.equal(
      resolveCountry({
        request: requestWithCountry('CA'),
        session: sessionWithCountry(stored),
      }),
      'CA',
      `expected the header to win over stored value: ${JSON.stringify(stored)}`,
    );
  }
});

test('resolveCountry tolerates a request with no headers object of its own', () => {
  assert.equal(
    resolveCountry({request: new Request('https://pawstie.com/'), session: noSession}),
    'US',
  );
});

test('resolveI18n pairs the resolved market with the single language', () => {
  assert.deepEqual(
    resolveI18n({request: requestWithCountry('CA'), session: noSession}),
    {language: 'EN', country: 'CA'},
  );
  assert.deepEqual(
    resolveI18n({request: requestWithCountry(null), session: noSession}),
    {language: 'EN', country: 'US'},
  );
});

test('every supported market is presentable in the switcher', () => {
  for (const country of SUPPORTED_COUNTRIES) {
    assert.ok(MARKETS[country]?.label, `no label for market: ${country}`);
    assert.ok(MARKETS[country]?.currency, `no currency for market: ${country}`);
  }
  assert.deepEqual(Object.keys(MARKETS), [...SUPPORTED_COUNTRIES]);
});

test('the Hydrogen context resolves the market instead of hardcoding it', () => {
  assert.match(context, /from '~\/lib\/i18n'/);
  assert.match(context, /i18n: resolveI18n\(\{request, session\}\)/);

  // The skeleton's hardcoded locale is what made the Canada market unreachable.
  assert.doesNotMatch(context, /country: 'US'/);
  assert.doesNotMatch(context, /language: 'EN'/);
});

test('the switcher redirect target cannot leave this origin', () => {
  // `redirectTo` arrives in a form field, so it is attacker controlled.
  for (const hostile of [
    'https://evil.com',
    '//evil.com',
    '/\\evil.com',
    'javascript:alert(1)',
    'http://pawstie.com.evil.com',
    '/shop\nLocation: https://evil.com',
    '  https://evil.com',
    '',
    null,
    undefined,
    42,
    {},
  ]) {
    assert.equal(
      safeRedirect(hostile),
      '/',
      `should not honor redirect target: ${JSON.stringify(hostile)}`,
    );
  }
});

test('the switcher returns the shopper to where they were', () => {
  assert.equal(safeRedirect('/'), '/');
  assert.equal(safeRedirect('/shop'), '/shop');
  assert.equal(safeRedirect('/shop?sort=featured'), '/shop?sort=featured');
  assert.equal(
    safeRedirect('/products/leather-collar'),
    '/products/leather-collar',
  );
  assert.equal(safeRedirect(' /shop '), '/shop');
  assert.equal(safeRedirect(null, '/shop'), '/shop');
});

test('the switch route validates, persists, syncs the cart, and 303s', () => {
  assert.match(countryRoute, /isSupportedCountry\(country\)/);
  assert.match(countryRoute, /status: 400/);
  assert.match(countryRoute, /session\.set\(COUNTRY_SESSION_KEY, country\)/);
  assert.match(countryRoute, /syncCartBuyerIdentity\(\{cart: context\.cart, country\}\)/);
  assert.match(countryRoute, /safeRedirect\(formData\.get\('redirectTo'\)\)/);

  // A client-side transition would skip the root loader (`shouldRevalidate`)
  // and leave the header and footer priced in the market just left.
  assert.match(countryRoute, /status: 303/);
});

test('adding to cart pins the new cart to the resolved market', () => {
  // buyerIdentity.countryCode — not @inContext — is what reaches checkout.
  assert.match(cartRoute, /syncCartBuyerIdentity\(\{/);
  assert.match(cartRoute, /country: storefront\.i18n\.country/);
  assert.match(cartRoute, /snapshot: result\?\.cart/);
});

test('no HTML route caches publicly while prices vary by market', async () => {
  // Pricing now varies by a geo header and a session cookie. A shared cache in
  // front of an HTML route would serve one market's prices to the other, and
  // like a CSP regression it fails silently — nothing 500s, the numbers are
  // just wrong. These four are the audited exceptions.
  const exempt = new Map([
    // Not HTML, and identical in every market.
    ['[robots.txt].tsx', /max-age/],
    ['[sitemap.xml].tsx', /max-age/],
    ['sitemap.$type.$page[.xml].tsx', /max-age/],
    // Per-customer, and must never be stored at all.
    ['account.tsx', /no-cache, no-store, must-revalidate/],
  ]);

  const files = (await readdir(routesDir)).filter((file) =>
    file.endsWith('.tsx'),
  );
  assert.ok(files.length > 20, 'route scan found suspiciously few files');

  for (const file of files) {
    const source = await readFile(new URL(file, routesDir), 'utf8');
    const expected = exempt.get(file);

    if (expected) {
      assert.match(source, expected, `exempt route changed its caching: ${file}`);
      continue;
    }

    assert.doesNotMatch(
      source,
      /Cache-Control/i,
      `${file} sets Cache-Control on a market-dependent response. If it is ` +
        `genuinely market-independent, add it to the exempt list above with ` +
        `the reason; otherwise it must not be cached by a shared cache.`,
    );
  }
});
