import {
  data as remixData,
  Form,
  NavLink,
  Outlet,
  useLoaderData,
} from 'react-router';
import type {Route} from './+types/account';
import {CUSTOMER_DETAILS_QUERY} from '~/graphql/customer-account/CustomerDetailsQuery';
import {
  ArrowRightOnRectangleIcon,
  MapPinIcon,
  TruckIcon,
  UserIcon,
} from '~/components/icons';
import {cn} from '~/lib/utils';

export function shouldRevalidate() {
  return true;
}

export async function loader({context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  const {data, errors} = await customerAccount.query(CUSTOMER_DETAILS_QUERY, {
    variables: {
      language: customerAccount.i18n.language,
    },
  });

  if (errors?.length || !data?.customer) {
    throw new Error('Customer not found');
  }

  return remixData(
    {customer: data.customer},
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    },
  );
}

export default function AccountLayout() {
  const {customer} = useLoaderData<typeof loader>();

  const heading = customer
    ? customer.firstName
      ? `Welcome back, ${customer.firstName}`
      : 'Welcome to your account'
    : 'Account details';

  return (
    <div className="px-6 pb-20 pt-10 lg:px-[7vw] lg:pb-28 lg:pt-14">
      <div className="mx-auto max-w-[80rem]">
        <header>
          <p className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-primary">
            Your account
          </p>
          <h1 className="mb-0 mt-3 font-heading text-4xl font-semibold leading-[0.95] tracking-[-0.05em] text-[#004817] sm:text-5xl">
            {heading}
          </h1>
          {customer?.emailAddress?.emailAddress ? (
            <p className="mt-4 text-lg text-[#347345]">
              {customer.emailAddress.emailAddress}
            </p>
          ) : null}
        </header>

        <div className="mt-10 flex flex-col gap-8 lg:mt-12 lg:grid lg:grid-cols-[16rem_1fr] lg:gap-12">
          <AccountSidebar />
          <div className="min-w-0">
            <Outlet context={{customer}} />
          </div>
        </div>
      </div>
    </div>
  );
}

const NAV_ITEM =
  'flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-heading text-sm font-semibold tracking-[-0.01em] transition-colors duration-200 hover:no-underline! focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00521d] motion-reduce:transition-none';
const NAV_ITEM_ACTIVE = 'bg-[#00521d] text-white! hover:bg-[#006523]';
const NAV_ITEM_INACTIVE = 'text-[#00521d]! hover:bg-[#effce9]';

const LINKS = [
  {to: '/account/orders', label: 'Orders', Icon: TruckIcon},
  {to: '/account/profile', label: 'Profile', Icon: UserIcon},
  {to: '/account/addresses', label: 'Addresses', Icon: MapPinIcon},
] as const;

function AccountSidebar() {
  return (
    <div className="lg:sticky lg:top-24 lg:self-start">
      <nav
        aria-label="Account"
        className="rounded-[1.75rem] border border-[#cdeccb] bg-white p-2.5"
      >
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {LINKS.map(({to, label, Icon}) => (
            <li key={to} className="m-0">
              <NavLink
                to={to}
                className={({isActive}) =>
                  cn(NAV_ITEM, isActive ? NAV_ITEM_ACTIVE : NAV_ITEM_INACTIVE)
                }
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="my-2 border-t border-[#e4f4e1]" />
        <Logout />
      </nav>
    </div>
  );
}

function Logout() {
  return (
    <Form method="POST" action="/account/logout">
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-heading text-sm font-semibold text-[#347345] transition-colors duration-200 hover:bg-[#f4efe9] hover:text-[#00521d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00521d] motion-reduce:transition-none"
      >
        <ArrowRightOnRectangleIcon className="size-4 shrink-0" />
        Sign out
      </button>
    </Form>
  );
}
