import {data} from 'react-router';
import type {Route} from './+types/api.reviews';
import {parseReviewSubmission, type ReviewActionResult} from '~/lib/reviews';

/**
 * Receives the product page's write-a-review form and passes it to Judge.me,
 * where it waits for moderation. It doesn't appear on the page until the
 * merchant publishes it there (see `isPublished` in lib/reviews.ts).
 *
 * Public by nature, so it trusts the body only for the review itself. A filled
 * honeypot gets a fake success, so the bot has nothing to learn from. With no
 * Judge.me token it answers 404, the same as if the route didn't exist.
 */
export async function action({request, context}: Route.ActionArgs) {
  if (request.method !== 'POST') return new Response(null, {status: 405});
  if (!context.reviews.enabled) return new Response(null, {status: 404});

  const form = Object.fromEntries(await request.formData());
  const productId = Number(form.productId);
  if (!Number.isSafeInteger(productId) || productId <= 0) {
    return data<ReviewActionResult>(
      {ok: false, error: 'This product could not be found.'},
      {status: 400},
    );
  }

  const parsed = parseReviewSubmission(form);
  if (!parsed.ok) {
    if (parsed.bot) return data<ReviewActionResult>({ok: true});
    return data<ReviewActionResult>(
      {ok: false, errors: parsed.errors},
      {status: 400},
    );
  }

  const sent = await context.reviews
    .submit({
      productId,
      review: parsed.data,
      ip: request.headers.get('oxygen-buyer-ip'),
    })
    .catch((error: unknown) => {
      console.error(error);
      return false;
    });

  if (!sent) {
    return data<ReviewActionResult>(
      {
        ok: false,
        error: "We couldn't send your review just now. Please try again in a minute.",
      },
      {status: 502},
    );
  }

  return data<ReviewActionResult>({ok: true});
}
