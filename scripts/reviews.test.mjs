import assert from 'node:assert/strict';
import test from 'node:test';
import {
  collectPages,
  displayName,
  isPublished,
  numericProductId,
  parseReviewSubmission,
  plainText,
  reviewsForProduct,
  sortReviews,
  summarize,
  toProductReview,
} from '../app/lib/reviews.ts';

// `app/lib/reviews.ts` is free of runtime imports for the same reason as
// `i18n.ts` and `hero.ts`: these tests load the real functions instead of
// string-matching their source. Everything a shopper sees passes through
// `toProductReview`, so it carries the safety-relevant assertions.

function raw(overrides = {}) {
  return {
    id: 1,
    title: 'Great collar',
    body: 'Fits well and the leather is soft.',
    rating: 5,
    pinned: false,
    product_external_id: 8123456789,
    product_handle: 'airtag-collar',
    reviewer: {
      id: 9,
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+15555550100',
    },
    ip_address: '203.0.113.7',
    source: 'web',
    curated: 'ok',
    hidden: false,
    verified: 'confirmed-buyer',
    created_at: '2026-10-01T12:00:00Z',
    ...overrides,
  };
}

test('only reviews the merchant published are shown', () => {
  assert.equal(isPublished(raw()), true);
  assert.equal(isPublished(raw({curated: 'not-yet'})), false);
  assert.equal(isPublished(raw({curated: 'spam'})), false);
  assert.equal(isPublished(raw({curated: 'ok', hidden: true})), false);
  assert.equal(toProductReview(raw({curated: 'not-yet'})), null);
});

test('no personal data survives into what the page receives', () => {
  const review = toProductReview(raw());
  const serialized = JSON.stringify(review);

  assert.doesNotMatch(serialized, /jane@example\.com/);
  assert.doesNotMatch(serialized, /203\.0\.113\.7/);
  assert.doesNotMatch(serialized, /5555550100/);
  assert.doesNotMatch(serialized, /Doe/);
  assert.equal(review.author, 'Jane D.');
});

test('names are reduced to first name and last initial', () => {
  assert.equal(displayName('Jane Doe'), 'Jane D.');
  assert.equal(displayName('  mary jane van der berg '), 'mary B.');
  assert.equal(displayName('Cher'), 'Cher');
  assert.equal(displayName(''), 'Pawstie customer');
  assert.equal(displayName(null), 'Pawstie customer');
});

test('only the statuses Judge.me documents as verified get the badge', () => {
  for (const status of [
    'confirmed-buyer',
    'buyer',
    'verified-purchase',
    'semi-verified-purchase',
    'admin',
  ]) {
    assert.equal(toProductReview(raw({verified: status})).verified, true, status);
  }
  for (const status of ['nothing', 'not-yet', 'unconfirmed-buyer', null]) {
    assert.equal(toProductReview(raw({verified: status})).verified, false, status);
  }
});

test('reviews that cannot be displayed honestly are dropped', () => {
  assert.equal(toProductReview(raw({rating: 0})), null);
  assert.equal(toProductReview(raw({rating: 6})), null);
  assert.equal(toProductReview(raw({rating: null})), null);
  assert.equal(toProductReview(raw({body: '   '})), null);
  assert.equal(toProductReview(raw({body: '<p></p>'})), null);
  assert.equal(toProductReview(raw({product_external_id: null})), null);
  assert.equal(toProductReview(raw({created_at: 'not a date'})), null);
});

test('raw text becomes plain text, keeping paragraph breaks', () => {
  assert.equal(
    plainText('<p>Soft &amp; sturdy.</p><p>My dog &lt;3 it</p>'),
    'Soft & sturdy.\n\nMy dog <3 it',
  );
  assert.equal(plainText('Line one<br>Line two'), 'Line one\nLine two');
  assert.equal(plainText('<script>alert(1)</script>Nice'), 'alert(1)Nice');
  assert.equal(plainText(null), '');
});

test('the date label is printed in UTC, so server and browser agree', () => {
  // 23:30 in New York on Oct 1 is already Oct 2 in UTC.
  const review = toProductReview(raw({created_at: '2026-10-01T23:30:00-04:00'}));
  assert.equal(review.dateLabel, 'Oct 2, 2026');
  assert.equal(review.createdAt, '2026-10-02T03:30:00.000Z');
});

test('pinned reviews lead, then newest first', () => {
  const reviews = [
    toProductReview(raw({id: 1, created_at: '2026-01-01T00:00:00Z'})),
    toProductReview(raw({id: 2, created_at: '2026-03-01T00:00:00Z'})),
    toProductReview(raw({id: 3, created_at: '2025-06-01T00:00:00Z', pinned: true})),
  ];
  assert.deepEqual(sortReviews(reviews).map((review) => review.id), [3, 2, 1]);
});

test('the summary averages to one decimal and is zero when empty', () => {
  const reviews = [5, 5, 4].map((rating, id) =>
    toProductReview(raw({id, rating})),
  );
  assert.deepEqual(summarize(reviews), {average: 4.7, count: 3});
  assert.deepEqual(summarize([]), {average: 0, count: 0});
});

test('a product only gets its own reviews', () => {
  const all = [
    toProductReview(raw({id: 1, product_external_id: 111})),
    toProductReview(raw({id: 2, product_external_id: 222, rating: 3})),
    toProductReview(raw({id: 3, product_external_id: 111, rating: 4})),
  ];
  const result = reviewsForProduct(all, 111);
  assert.deepEqual(result.reviews.map((review) => review.id).sort(), [1, 3]);
  assert.deepEqual(result.summary, {average: 4.5, count: 2});
  assert.deepEqual(reviewsForProduct(all, 999).summary, {average: 0, count: 0});
});

test('Shopify gids map to the numeric id Judge.me calls external_id', () => {
  assert.equal(numericProductId('gid://shopify/Product/8123456789'), 8123456789);
  assert.equal(numericProductId('gid://shopify/Product/'), null);
  assert.equal(numericProductId('nonsense'), null);
});

test('pagination walks until a short page', async () => {
  const pages = {1: [1, 2], 2: [3, 4], 3: [5]};
  const asked = [];
  const items = await collectPages(async (page) => {
    asked.push(page);
    return {items: pages[page] ?? [], perPage: 2};
  }, 20);
  assert.deepEqual(items, [1, 2, 3, 4, 5]);
  assert.deepEqual(asked, [1, 2, 3]);
});

test('pagination trusts the page size the server reports, not the one asked for', async () => {
  // Asked for 100, server capped it at 2: a full page of 2 is not the end.
  const pages = {1: [1, 2], 2: [3]};
  const items = await collectPages(
    async (page) => ({items: pages[page] ?? [], perPage: 2}),
    20,
  );
  assert.deepEqual(items, [1, 2, 3]);
});

test('pagination stops at the page cap', async () => {
  let calls = 0;
  await collectPages(async () => {
    calls++;
    return {items: [1], perPage: 1};
  }, 3);
  assert.equal(calls, 3);
});

function form(overrides = {}) {
  return {
    rating: '5',
    name: '  Sam Lee ',
    email: 'sam@example.com',
    title: 'Love it',
    body: 'Holds the AirTag snugly and looks great.',
    website: '',
    ...overrides,
  };
}

test('a complete review form is accepted and trimmed', () => {
  assert.deepEqual(parseReviewSubmission(form()), {
    ok: true,
    data: {
      rating: 5,
      name: 'Sam Lee',
      email: 'sam@example.com',
      title: 'Love it',
      body: 'Holds the AirTag snugly and looks great.',
    },
  });
  assert.equal(parseReviewSubmission(form({title: ''})).ok, true);
});

test('each missing or bad field gets its own message', () => {
  const result = parseReviewSubmission(
    form({rating: '0', name: '', email: 'nope', body: 'short'}),
  );
  assert.equal(result.ok, false);
  assert.deepEqual(Object.keys(result.errors).sort(), [
    'body',
    'email',
    'name',
    'rating',
  ]);
  assert.equal(parseReviewSubmission(form({rating: '4.5'})).ok, false);
  assert.equal(parseReviewSubmission(form({title: 'x'.repeat(121)})).ok, false);
  assert.equal(parseReviewSubmission(form({body: 'x'.repeat(5001)})).ok, false);
});

test('a filled honeypot is flagged as a bot, not as a form error', () => {
  const result = parseReviewSubmission(form({website: 'http://spam.example'}));
  assert.deepEqual(result, {ok: false, bot: true, errors: {}});
});
