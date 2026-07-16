import {
  Link,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from 'react-router';
import type {Route} from './+types/account.orders._index';
import {useRef} from 'react';
import {
  Money,
  getPaginationVariables,
  flattenConnection,
} from '@shopify/hydrogen';
import {
  buildOrderSearchQuery,
  parseOrderFilters,
  ORDER_FILTER_FIELDS,
  type OrderFilterParams,
} from '~/lib/orderFilters';
import {CUSTOMER_ORDERS_QUERY} from '~/graphql/customer-account/CustomerOrdersQuery';
import type {
  CustomerOrdersFragment,
  OrderItemFragment,
} from 'customer-accountapi.generated';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {SearchIcon} from '~/components/icons';

type OrdersLoaderData = {
  customer: CustomerOrdersFragment;
  filters: OrderFilterParams;
};

export const meta: Route.MetaFunction = () => {
  return [{title: 'Orders'}];
};

export async function loader({request, context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 20,
  });

  const url = new URL(request.url);
  const filters = parseOrderFilters(url.searchParams);
  const query = buildOrderSearchQuery(filters);

  const {data, errors} = await customerAccount.query(CUSTOMER_ORDERS_QUERY, {
    variables: {
      ...paginationVariables,
      query,
      language: customerAccount.i18n.language,
    },
  });

  if (errors?.length || !data?.customer) {
    throw Error('Customer orders not found');
  }

  return {customer: data.customer, filters};
}

export default function Orders() {
  const {customer, filters} = useLoaderData<OrdersLoaderData>();
  const {orders} = customer;

  return (
    <div className="flex flex-col gap-6">
      <OrderSearchForm currentFilters={filters} />
      <OrdersTable orders={orders} filters={filters} />
    </div>
  );
}

function OrdersTable({
  orders,
  filters,
}: {
  orders: CustomerOrdersFragment['orders'];
  filters: OrderFilterParams;
}) {
  const hasFilters = !!(filters.name || filters.confirmationNumber);

  return (
    <div aria-live="polite">
      {orders?.nodes.length ? (
        <PaginatedResourceSection
          connection={orders}
          resourcesClassName="flex flex-col gap-4"
        >
          {({node: order}) => <OrderItem key={order.id} order={order} />}
        </PaginatedResourceSection>
      ) : (
        <EmptyOrders hasFilters={hasFilters} />
      )}
    </div>
  );
}

function EmptyOrders({hasFilters = false}: {hasFilters?: boolean}) {
  return (
    <div className="rounded-[2rem] bg-[#effce9] px-6 py-16 text-center">
      {hasFilters ? (
        <>
          <h2 className="mb-0 font-heading text-2xl font-semibold text-[#004817]">
            No orders found
          </h2>
          <p className="mt-3 text-[#347345]">
            No orders match your search filters.
          </p>
          <Link
            to="/account/orders"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#00521d] px-6 font-heading text-sm font-semibold text-white! transition-colors hover:bg-[#006523] hover:no-underline! focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#00521d]"
          >
            Clear filters
          </Link>
        </>
      ) : (
        <>
          <h2 className="mb-0 font-heading text-2xl font-semibold text-[#004817]">
            No orders yet
          </h2>
          <p className="mt-3 text-[#347345]">
            You haven&apos;t placed any orders yet.
          </p>
          <Link
            to="/shop"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 font-heading text-sm font-semibold text-white! transition-colors hover:bg-[#8f440b] hover:no-underline! focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#00521d]"
          >
            Start shopping
          </Link>
        </>
      )}
    </div>
  );
}

const FILTER_FIELD_INPUT =
  'w-full border-0 bg-transparent p-0 font-heading text-sm font-medium text-[#004817] placeholder:font-normal placeholder:text-[#7fa688] focus:outline-none';
const FILTER_FIELD_LABEL =
  'font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-[#347345]';

function OrderSearchForm({
  currentFilters,
}: {
  currentFilters: OrderFilterParams;
}) {
  const [, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isSearching =
    navigation.state !== 'idle' &&
    navigation.location?.pathname?.includes('orders');
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    const name = formData.get(ORDER_FILTER_FIELDS.NAME)?.toString().trim();
    const confirmationNumber = formData
      .get(ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER)
      ?.toString()
      .trim();

    if (name) params.set(ORDER_FILTER_FIELDS.NAME, name);
    if (confirmationNumber)
      params.set(ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER, confirmationNumber);

    setSearchParams(params);
  };

  const hasFilters = currentFilters.name || currentFilters.confirmationNumber;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      aria-label="Search orders"
      className="flex flex-col gap-3"
    >
      <fieldset className="m-0 border-0 p-0">
        <legend className="sr-only">Filter orders</legend>

        {/* Segmented search bar: leading icon, two fields split by a divider,
            and an attached submit. Reads as one filter control, not a form. */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-[#cdeccb] bg-white shadow-[0_1px_2px_rgba(0,72,23,0.04)] focus-within:border-[#00521d] sm:flex-row sm:items-stretch">
          <div className="flex flex-1 items-center gap-3 px-4 py-2.5">
            <SearchIcon className="hidden size-4 shrink-0 text-[#7fa688] sm:block" />
            <label className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className={FILTER_FIELD_LABEL}>Order #</span>
              <input
                type="search"
                name={ORDER_FILTER_FIELDS.NAME}
                placeholder="e.g. 1001"
                defaultValue={currentFilters.name || ''}
                className={FILTER_FIELD_INPUT}
              />
            </label>
          </div>

          <div className="mx-4 h-px bg-[#e4f4e1] sm:mx-0 sm:my-3 sm:h-auto sm:w-px" />

          <div className="flex flex-1 items-center px-4 py-2.5">
            <label className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className={FILTER_FIELD_LABEL}>Confirmation #</span>
              <input
                type="search"
                name={ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER}
                placeholder="e.g. ABC123"
                defaultValue={currentFilters.confirmationNumber || ''}
                className={FILTER_FIELD_INPUT}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="inline-flex items-center justify-center gap-2 bg-[#00521d] px-6 py-3 font-heading text-sm font-semibold text-white! transition-colors hover:bg-[#006523] hover:no-underline! focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSearching ? 'Searching…' : 'Search'}
          </button>
        </div>
      </fieldset>

      {hasFilters && (
        <button
          type="button"
          disabled={isSearching}
          onClick={() => {
            setSearchParams(new URLSearchParams());
            formRef.current?.reset();
          }}
          className="self-start font-heading text-sm font-semibold text-[#347345] underline-offset-4 transition-colors hover:text-[#00521d] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00521d] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Clear filters
        </button>
      )}
    </form>
  );
}

function OrderItem({order}: {order: OrderItemFragment}) {
  const fulfillmentStatus = flattenConnection(order.fulfillments)[0]?.status;
  return (
    <div className="flex flex-col gap-4 rounded-[2rem] border border-[#cdeccb] bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div>
        <Link
          to={`/account/orders/${btoa(order.id)}`}
          className="font-heading text-lg font-semibold text-[#004817] hover:text-[#006523]"
        >
          Order #{order.number}
        </Link>
        <p className="mt-1 text-sm text-[#347345]">
          {new Date(order.processedAt).toDateString()}
        </p>
        {order.confirmationNumber && (
          <p className="mt-0.5 text-sm text-[#347345]">
            Confirmation: {order.confirmationNumber}
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full bg-[#effce9] px-3 py-1 font-heading text-xs font-semibold text-[#00521d]">
            {order.financialStatus}
          </span>
          {fulfillmentStatus && (
            <span className="inline-flex items-center rounded-full bg-[#effce9] px-3 py-1 font-heading text-xs font-semibold text-[#00521d]">
              {fulfillmentStatus}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
        <Money
          data={order.totalPrice}
          className="font-heading text-lg font-semibold text-[#004817]"
        />
        <Link
          to={`/account/orders/${btoa(order.id)}`}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#cdeccb] px-5 font-heading text-sm font-semibold text-[#00521d] transition-colors hover:border-[#00521d] hover:no-underline!"
        >
          View order
        </Link>
      </div>
    </div>
  );
}
