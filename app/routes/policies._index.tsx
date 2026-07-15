import {useLoaderData, Link} from 'react-router';
import type {Route} from './+types/policies._index';
import type {PoliciesQuery, PolicyItemFragment} from 'storefrontapi.generated';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Pawstie | Policies'},
    {
      name: 'description',
      content:
        'Read the Pawstie store policies — privacy, shipping, returns, and terms of service.',
    },
  ];
};

export async function loader({context}: Route.LoaderArgs) {
  const data: PoliciesQuery = await context.storefront.query(POLICIES_QUERY);

  const shopPolicies = data.shop;
  const policies: PolicyItemFragment[] = [
    shopPolicies?.privacyPolicy,
    shopPolicies?.shippingPolicy,
    shopPolicies?.termsOfService,
    shopPolicies?.refundPolicy,
    shopPolicies?.contactInformation,
    shopPolicies?.subscriptionPolicy,
  ].filter((policy): policy is PolicyItemFragment => policy != null);

  if (!policies.length) {
    throw new Response('No policies found', {status: 404});
  }

  return {policies};
}

export default function Policies() {
  const {policies} = useLoaderData<typeof loader>();

  return (
    <div className="pb-20 lg:pb-28">
      <section className="px-6 pt-10 pb-8 lg:px-[7vw] lg:pt-14">
        <div className="mx-auto max-w-[80rem]">
          <p className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-primary">
            The fine print
          </p>
          <h1 className="mb-0 mt-3 font-heading text-5xl font-semibold leading-[0.95] tracking-[-0.05em] text-[#004817] sm:text-6xl">
            Policies
          </h1>
          <p className="mt-5 max-w-[34rem] text-lg leading-relaxed text-[#347345]">
            Everything you need to know about shopping with Pawstie — how we
            handle your data, ship your order, and take things back.
          </p>
        </div>
      </section>

      <div className="px-6 lg:px-[7vw]">
        <div className="mx-auto max-w-[80rem]">
          <ul className="grid list-none gap-4 pl-0 sm:grid-cols-2">
            {policies.map((policy) => (
              <li key={policy.id}>
                <Link
                  to={`/policies/${policy.handle}`}
                  prefetch="intent"
                  className="group flex min-h-16 items-center justify-between gap-4 rounded-2xl border border-[#004817]/10 bg-white px-6 py-5 transition-colors hover:border-[#004817]/25 hover:bg-[#effce9] hover:no-underline! focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#00521d]"
                >
                  <span className="font-heading text-lg font-semibold text-[#004817]">
                    {policy.title}
                  </span>
                  <span
                    aria-hidden="true"
                    className="text-xl text-primary transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const POLICIES_QUERY = `#graphql
  fragment PolicyItem on ShopPolicy {
    id
    title
    handle
  }
  query Policies ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    shop {
      privacyPolicy {
        ...PolicyItem
      }
      shippingPolicy {
        ...PolicyItem
      }
      termsOfService {
        ...PolicyItem
      }
      refundPolicy {
        ...PolicyItem
      }
      contactInformation {
        ...PolicyItem
      }
      subscriptionPolicy {
        id
        title
        handle
      }
    }
  }
` as const;
