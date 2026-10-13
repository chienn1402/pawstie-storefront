import {createHydrogenContext, createWithCache} from '@shopify/hydrogen';
import {AppSession} from '~/lib/session';
import {resolveI18n} from '~/lib/i18n';
import {createReviewsClient} from '~/lib/reviews.server';
import {CART_QUERY_FRAGMENT} from '~/lib/fragments';
import type {CartApiQueryFragment} from 'storefrontapi.generated';

/**
 * Custom clients for third-party APIs. Each entry is available in loaders and
 * actions as both context.propertyName and context.get(propertyContext).
 * `withCache` gives them the same sub-request cache as the Storefront client.
 */
function createAdditionalContext({
  env,
  request,
  cache,
  waitUntil,
}: {
  env: Env;
  request: Request;
  cache: Cache;
  waitUntil: (promise: Promise<unknown>) => void;
}) {
  const withCache = createWithCache({cache, waitUntil, request});

  return {
    reviews: createReviewsClient({env, withCache}),
  } as const;
}

// Automatically augment HydrogenAdditionalContext with the additional context type
type AdditionalContextType = ReturnType<typeof createAdditionalContext>;

declare global {
  interface HydrogenAdditionalContext extends AdditionalContextType {}

  // Augment HydrogenCustomCartFragment with the codegen'd cart fragment type so
  // that context.cart.get() and all cart mutations return the extended cart type.
  interface HydrogenCustomCartFragment extends CartApiQueryFragment {}
}

/**
 * Creates Hydrogen context for React Router 7.9.x
 * Returns HydrogenRouterContextProvider with hybrid access patterns
 * */
export async function createHydrogenRouterContext(
  request: Request,
  env: Env,
  executionContext: ExecutionContext,
) {
  /**
   * Open a cache instance in the worker and a custom session instance.
   */
  if (!env?.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is not set');
  }

  const waitUntil = executionContext.waitUntil.bind(executionContext);
  const [cache, session] = await Promise.all([
    caches.open('hydrogen'),
    AppSession.init(request, [env.SESSION_SECRET]),
  ]);

  const hydrogenContext = createHydrogenContext(
    {
      env,
      request,
      cache,
      waitUntil,
      session,
      // Market: an explicit shopper choice in the session, then the
      // oxygen-buyer-country header, then US. Every @inContext query and the
      // cart handler read this, so it is what decides the currency on offer.
      i18n: resolveI18n({request, session}),
      cart: {
        queryFragment: CART_QUERY_FRAGMENT,
      },
    },
    createAdditionalContext({env, request, cache, waitUntil}),
  );

  return hydrogenContext;
}
