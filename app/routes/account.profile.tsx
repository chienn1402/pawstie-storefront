import type {CustomerFragment} from 'customer-accountapi.generated';
import type {CustomerUpdateInput} from '@shopify/hydrogen/customer-account-api-types';
import {CUSTOMER_UPDATE_MUTATION} from '~/graphql/customer-account/CustomerUpdateMutation';
import {
  data,
  Form,
  useActionData,
  useNavigation,
  useOutletContext,
} from 'react-router';
import type {Route} from './+types/account.profile';

export type ActionResponse = {
  error: string | null;
  customer: CustomerFragment | null;
};

export const meta: Route.MetaFunction = () => {
  return [{title: 'Profile'}];
};

export async function loader({context}: Route.LoaderArgs) {
  await context.customerAccount.handleAuthStatus();

  return {};
}

export async function action({request, context}: Route.ActionArgs) {
  const {customerAccount} = context;

  if (request.method !== 'PUT') {
    return data({error: 'Method not allowed'}, {status: 405});
  }

  const form = await request.formData();

  try {
    const customer: CustomerUpdateInput = {};
    const validInputKeys = ['firstName', 'lastName'] as const;
    for (const [key, value] of form.entries()) {
      if (!validInputKeys.includes(key as any)) {
        continue;
      }
      if (typeof value === 'string' && value.length) {
        customer[key as (typeof validInputKeys)[number]] = value;
      }
    }

    // update customer and possibly password
    const {data, errors} = await customerAccount.mutate(
      CUSTOMER_UPDATE_MUTATION,
      {
        variables: {
          customer,
          language: customerAccount.i18n.language,
        },
      },
    );

    if (errors?.length) {
      throw new Error(errors[0].message);
    }

    if (!data?.customerUpdate?.customer) {
      throw new Error('Customer profile update failed.');
    }

    return {
      error: null,
      customer: data?.customerUpdate?.customer,
    };
  } catch (error: any) {
    return data(
      {error: error.message, customer: null},
      {
        status: 400,
      },
    );
  }
}

const FIELD_LABEL =
  'mb-1.5 block font-heading text-sm font-semibold text-[#00521d]';
const FIELD_INPUT =
  'w-full rounded-2xl border border-[#cdeccb] bg-[#f7fdf5] px-4 py-3 text-sm text-[#004817] placeholder:text-[#7fa688] transition-colors focus-visible:border-[#00521d] focus-visible:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00521d]';
const SUBMIT_BUTTON =
  'inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 font-heading text-sm font-semibold text-white! transition-colors duration-200 hover:bg-[#8f440b] hover:no-underline! focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#00521d] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none';

export default function AccountProfile() {
  const account = useOutletContext<{customer: CustomerFragment}>();
  const {state} = useNavigation();
  const action = useActionData<ActionResponse>();
  const customer = action?.customer ?? account?.customer;

  return (
    <div className="max-w-[36rem] rounded-[2rem] border border-[#cdeccb] bg-white p-6 sm:p-8">
      <header className="border-b border-[#e4f4e1] pb-5">
        <h2 className="mb-0 font-heading text-2xl font-semibold text-[#004817]">
          My profile
        </h2>
        <p className="mt-1.5 text-sm text-[#347345]">
          Update the name shown on your orders and account.
        </p>
      </header>
      <Form method="PUT" className="mt-6">
        <p className="mb-4 font-heading text-xs font-bold uppercase tracking-[0.16em] text-[#347345]">
          Personal information
        </p>
        <fieldset className="m-0 grid gap-5 border-0 p-0 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className={FIELD_LABEL}>
              First name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              placeholder="First name"
              aria-label="First name"
              defaultValue={customer.firstName ?? ''}
              minLength={2}
              className={FIELD_INPUT}
            />
          </div>
          <div>
            <label htmlFor="lastName" className={FIELD_LABEL}>
              Last name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              placeholder="Last name"
              aria-label="Last name"
              defaultValue={customer.lastName ?? ''}
              minLength={2}
              className={FIELD_INPUT}
            />
          </div>
        </fieldset>
        {action?.error ? (
          <p role="alert" className="mt-4 text-sm font-semibold text-destructive">
            {action.error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={state !== 'idle'}
          className={`mt-6 ${SUBMIT_BUTTON}`}
        >
          {state !== 'idle' ? 'Updating…' : 'Update'}
        </button>
      </Form>
    </div>
  );
}
