import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FALLBACK_ROUTINE,
  maxPercentOff,
  percentOff,
  routineFor,
  routinesSentence,
  toHeroSlides,
  withFeaturedFirst,
} from '../app/lib/hero.ts';

// `app/lib/hero.ts` is free of runtime imports for the same reason as
// `i18n.ts`: these tests load the real functions instead of string-matching
// their source.

const usd = (amount) => ({amount, currencyCode: 'USD'});

function product(title, {price = '20.00', compareAt = null, available = true, image = true} = {}) {
  return {
    id: `gid://shopify/Product/${title}`,
    title,
    handle: title.toLowerCase().replaceAll(' ', '-'),
    featuredImage: image ? {url: `https://cdn.shopify.com/${title}.jpg`} : null,
    selectedOrFirstAvailableVariant: {
      availableForSale: available,
      price: usd(price),
      compareAtPrice: compareAt ? usd(compareAt) : null,
    },
  };
}

test('routineFor maps the live catalogue titles to their routine', () => {
  assert.equal(routineFor('The Signature Genuine Leather AirTag Collar'), 'Walks');
  assert.equal(routineFor('The Heritage Genuine Leather Leash'), 'Walks');
  assert.equal(routineFor('The Pawstie Cloud Nine 2-in-1 Calming Tunnel Bed'), 'Naps');
  assert.equal(routineFor('The Avocado Comfort Pet De-Shedding & Massage Brush'), 'Grooming');
  // "Belt" must not be read as a collar: travel wins over walk words.
  assert.equal(routineFor('Pawstie 2-in-1 Pet Car Safety Belt & Travel Tether'), 'Road trips');
});

test('routineFor matches whole words and falls back for the unknown', () => {
  assert.equal(routineFor('Embedded Ceramic Thing'), FALLBACK_ROUTINE);
  assert.equal(routineFor('Gift card'), FALLBACK_ROUTINE);
});

test('percentOff rounds down and ignores fake or missing compare-at prices', () => {
  assert.equal(percentOff(usd('39.99'), usd('54.99')), 27); // 27.27…
  assert.equal(percentOff(usd('29.99'), usd('39.99')), 25); // 25.006…
  assert.equal(percentOff(usd('19.99'), null), 0);
  assert.equal(percentOff(usd('20.00'), usd('20.00')), 0);
  assert.equal(percentOff(usd('25.00'), usd('20.00')), 0);
});

test('toHeroSlides drops sold-out and photo-less products', () => {
  const slides = toHeroSlides([
    product('Leather Collar'),
    product('Sold Out Bed', {available: false}),
    product('Blank Brush', {image: false}),
  ]);
  assert.deepEqual(
    slides.map((slide) => slide.title),
    ['Leather Collar'],
  );
});

test('toHeroSlides interleaves routines but keeps best-seller order within each', () => {
  const slides = toHeroSlides([
    product('Collar A'),
    product('Collar B'),
    product('Leash C'),
    product('Tunnel Bed'),
    product('Shedding Brush'),
  ]);
  assert.deepEqual(
    slides.map((slide) => slide.title),
    ['Collar A', 'Tunnel Bed', 'Shedding Brush', 'Collar B', 'Leash C'],
  );
});

test('toHeroSlides respects the limit', () => {
  const many = Array.from({length: 12}, (_, i) => product(`Collar ${i}`));
  assert.equal(toHeroSlides(many, 7).length, 7);
});

test('only a real saving sets compareAtPrice, and maxPercentOff reads it', () => {
  const slides = toHeroSlides([
    product('Leather Collar', {price: '39.99', compareAt: '54.99'}),
    product('Car Tether', {price: '19.99'}),
    product('Tunnel Bed', {price: '89.99', compareAt: '89.99'}),
  ]);
  const byTitle = Object.fromEntries(slides.map((slide) => [slide.title, slide]));
  assert.deepEqual(byTitle['Leather Collar'].compareAtPrice, usd('54.99'));
  assert.equal(byTitle['Car Tether'].compareAtPrice, null);
  assert.equal(byTitle['Tunnel Bed'].compareAtPrice, null);
  assert.equal(maxPercentOff(slides), 27);
  assert.equal(maxPercentOff([]), 0);
});

test('routinesSentence lists each routine once for screen readers', () => {
  const slides = toHeroSlides([
    product('Collar A'),
    product('Collar B'),
    product('Tunnel Bed'),
    product('Shedding Brush'),
  ]);
  assert.equal(routinesSentence(slides), 'Walks, naps and grooming, upgraded.');
  assert.equal(routinesSentence([]), 'Every day, upgraded.');
});

test('withFeaturedFirst leads with the ad product without duplicating it', () => {
  const collar = product('Leather Collar');
  const bed = product('Tunnel Bed');
  const brush = product('Shedding Brush');
  assert.deepEqual(
    withFeaturedFirst(brush, [bed, collar, brush]).map((p) => p.title),
    ['Shedding Brush', 'Tunnel Bed', 'Leather Collar'],
  );
  assert.deepEqual(
    withFeaturedFirst(null, [bed, collar]).map((p) => p.title),
    ['Tunnel Bed', 'Leather Collar'],
  );
  // ...and it survives the routine interleave as slide one.
  const slides = toHeroSlides(withFeaturedFirst(brush, [bed, collar, brush]));
  assert.equal(slides[0].title, 'Shedding Brush');
});
