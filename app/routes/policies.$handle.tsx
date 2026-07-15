import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/policies.$handle';
import {type Shop} from '@shopify/hydrogen/storefront-api-types';

type SelectedPolicies = keyof Pick<
  Shop,
  | 'privacyPolicy'
  | 'shippingPolicy'
  | 'termsOfService'
  | 'refundPolicy'
  | 'contactInformation'
>;

export const meta: Route.MetaFunction = ({data}) => {
  return [{title: `Pawstie | ${data?.policy.title ?? ''}`}];
};

export async function loader({params, context}: Route.LoaderArgs) {
  if (!params.handle) {
    throw new Response('No handle was passed in', {status: 404});
  }

  const policyName = params.handle.replace(
    /-([a-z])/g,
    (_: unknown, m1: string) => m1.toUpperCase(),
  ) as SelectedPolicies;

  const data = await context.storefront.query(POLICY_CONTENT_QUERY, {
    variables: {
      privacyPolicy: false,
      shippingPolicy: false,
      termsOfService: false,
      refundPolicy: false,
      contactInformation: false,
      [policyName]: true,
      language: context.storefront.i18n?.language,
    },
  });

  const policy = data.shop?.[policyName];

  if (!policy) {
    throw new Response('Could not find the policy', {status: 404});
  }

  return {policy};
}

export default function Policy() {
  const {policy} = useLoaderData<typeof loader>();

  return (
    <div className="pb-20 lg:pb-28">
      <section className="px-6 pt-10 pb-8 lg:px-[7vw] lg:pt-14">
        <div className="mx-auto max-w-[48rem]">
          <Link
            to="/policies"
            prefetch="intent"
            className="inline-flex items-center gap-1.5 font-heading text-sm font-semibold text-[#00521d] hover:text-[#006523] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#00521d]"
          >
            <span aria-hidden="true">←</span> Back to policies
          </Link>
          <h1 className="mb-0 mt-6 font-heading text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-[#004817] sm:text-5xl">
            {policy.title}
          </h1>
        </div>
      </section>

      <div className="px-6 lg:px-[7vw]">
        <div
          className="mx-auto max-w-[48rem] text-[#347345] [&_a]:text-[#00521d] [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-[#006523] [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-[#004817] [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:font-heading [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-[#004817] [&_li]:mb-2 [&_li]:leading-relaxed [&_ol]:mb-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-5 [&_p]:leading-relaxed [&_strong]:font-semibold [&_strong]:text-[#004817] [&_ul]:mb-5 [&_ul]:list-disc [&_ul]:pl-6"
          dangerouslySetInnerHTML={{__html: policy.body}}
        />
      </div>
    </div>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/Shop
const POLICY_CONTENT_QUERY = `#graphql
  fragment Policy on ShopPolicy {
    body
    handle
    id
    title
    url
  }
  query Policy(
    $country: CountryCode
    $language: LanguageCode
    $privacyPolicy: Boolean!
    $refundPolicy: Boolean!
    $shippingPolicy: Boolean!
    $termsOfService: Boolean!
    $contactInformation: Boolean!
  ) @inContext(language: $language, country: $country) {
    shop {
      privacyPolicy @include(if: $privacyPolicy) {
        ...Policy
      }
      shippingPolicy @include(if: $shippingPolicy) {
        ...Policy
      }
      termsOfService @include(if: $termsOfService) {
        ...Policy
      }
      refundPolicy @include(if: $refundPolicy) {
        ...Policy
      }
      contactInformation @include(if: $contactInformation) {
        ...Policy
      }
    }
  }
` as const;
