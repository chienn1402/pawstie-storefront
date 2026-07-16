import {Link, redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/account.orders.$id';
import {Money, Image} from '@shopify/hydrogen';
import type {
  OrderLineItemFullFragment,
  OrderQuery,
} from 'customer-accountapi.generated';
import {CUSTOMER_ORDER_QUERY} from '~/graphql/customer-account/CustomerOrderQuery';

export const meta: Route.MetaFunction = ({data}) => {
  return [{title: `Order ${data?.order?.name}`}];
};

export async function loader({params, context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  if (!params.id) {
    return redirect('/account/orders');
  }

  const orderId = atob(params.id);
  const {data, errors}: {data: OrderQuery; errors?: Array<{message: string}>} =
    await customerAccount.query(CUSTOMER_ORDER_QUERY, {
      variables: {
        orderId,
        language: customerAccount.i18n.language,
      },
    });

  if (errors?.length || !data?.order) {
    throw new Error('Order not found');
  }

  const {order} = data;

  // Extract line items directly from nodes array
  const lineItems = order.lineItems.nodes;

  // Extract discount applications directly from nodes array
  const discountApplications = order.discountApplications.nodes;

  // Get fulfillment status from first fulfillment node
  const fulfillmentStatus = order.fulfillments.nodes[0]?.status ?? 'N/A';

  // Get first discount value with proper type checking
  const firstDiscount = discountApplications[0]?.value;

  // Type guard for MoneyV2 discount
  const discountValue =
    firstDiscount?.__typename === 'MoneyV2'
      ? (firstDiscount as Extract<
          typeof firstDiscount,
          {__typename: 'MoneyV2'}
        >)
      : null;

  // Type guard for percentage discount
  const discountPercentage =
    firstDiscount?.__typename === 'PricingPercentageValue'
      ? (
          firstDiscount as Extract<
            typeof firstDiscount,
            {__typename: 'PricingPercentageValue'}
          >
        ).percentage
      : null;

  return {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    fulfillmentStatus,
  };
}

const CELL = 'px-3 py-3 first:pl-0 last:pr-0 sm:px-4';

export default function OrderRoute() {
  const {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    fulfillmentStatus,
  } = useLoaderData<typeof loader>();
  return (
    <div>
      <Link
        to="/account/orders"
        className="inline-flex items-center gap-1.5 font-heading text-sm font-semibold text-[#00521d] hover:text-[#006523]"
      >
        <span aria-hidden="true">←</span> Back to orders
      </Link>

      <h2 className="mb-0 mt-4 font-heading text-3xl font-semibold tracking-[-0.03em] text-[#004817]">
        Order {order.name}
      </h2>
      <p className="mt-2 text-sm text-[#347345]">
        Placed on {new Date(order.processedAt!).toDateString()}
      </p>
      {order.confirmationNumber && (
        <p className="mt-0.5 text-sm text-[#347345]">
          Confirmation: {order.confirmationNumber}
        </p>
      )}

      <div className="mt-8 overflow-x-auto rounded-[2rem] border border-[#cdeccb] bg-white p-5 sm:p-6">
        <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#cdeccb]">
              <th
                scope="col"
                className={`${CELL} font-heading text-xs font-bold uppercase tracking-[0.1em] text-[#347345]`}
              >
                Product
              </th>
              <th
                scope="col"
                className={`${CELL} font-heading text-xs font-bold uppercase tracking-[0.1em] text-[#347345]`}
              >
                Price
              </th>
              <th
                scope="col"
                className={`${CELL} font-heading text-xs font-bold uppercase tracking-[0.1em] text-[#347345]`}
              >
                Quantity
              </th>
              <th
                scope="col"
                className={`${CELL} text-right font-heading text-xs font-bold uppercase tracking-[0.1em] text-[#347345]`}
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((lineItem, lineItemIndex) => (
              // eslint-disable-next-line react/no-array-index-key
              <OrderLineRow key={lineItemIndex} lineItem={lineItem} />
            ))}
          </tbody>
          <tfoot>
            {((discountValue && discountValue.amount) ||
              discountPercentage) && (
              <tr className="border-t border-[#cdeccb]">
                <th
                  scope="row"
                  colSpan={3}
                  className={`${CELL} text-right font-heading text-sm font-semibold text-[#004817]`}
                >
                  Discounts
                </th>
                <td className={`${CELL} text-right text-[#004817]`}>
                  {discountPercentage ? (
                    <span>-{discountPercentage}% OFF</span>
                  ) : (
                    discountValue && <Money data={discountValue!} />
                  )}
                </td>
              </tr>
            )}
            <tr className="border-t border-[#cdeccb]">
              <th
                scope="row"
                colSpan={3}
                className={`${CELL} text-right font-heading text-sm font-semibold text-[#004817]`}
              >
                Subtotal
              </th>
              <td className={`${CELL} text-right text-[#004817]`}>
                <Money data={order.subtotal!} />
              </td>
            </tr>
            <tr>
              <th
                scope="row"
                colSpan={3}
                className={`${CELL} text-right font-heading text-sm font-semibold text-[#004817]`}
              >
                Tax
              </th>
              <td className={`${CELL} text-right text-[#004817]`}>
                <Money data={order.totalTax!} />
              </td>
            </tr>
            <tr className="border-t border-[#cdeccb]">
              <th
                scope="row"
                colSpan={3}
                className={`${CELL} text-right font-heading text-base font-semibold text-[#004817]`}
              >
                Total
              </th>
              <td
                className={`${CELL} text-right font-heading text-base font-semibold text-[#004817]`}
              >
                <Money data={order.totalPrice!} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="rounded-[2rem] border border-[#cdeccb] bg-white p-5 sm:p-6">
          <h3 className="mb-0 font-heading text-lg font-semibold text-[#004817]">
            Shipping address
          </h3>
          {order?.shippingAddress ? (
            <address className="mt-3 not-italic leading-relaxed text-[#347345]">
              <p className="m-0">{order.shippingAddress.name}</p>
              {order.shippingAddress.formatted ? (
                <p className="m-0">{order.shippingAddress.formatted}</p>
              ) : (
                ''
              )}
              {order.shippingAddress.formattedArea ? (
                <p className="m-0">{order.shippingAddress.formattedArea}</p>
              ) : (
                ''
              )}
            </address>
          ) : (
            <p className="mt-3 text-[#347345]">No shipping address defined</p>
          )}
        </div>
        <div className="rounded-[2rem] border border-[#cdeccb] bg-white p-5 sm:p-6">
          <h3 className="mb-0 font-heading text-lg font-semibold text-[#004817]">
            Status
          </h3>
          <span className="mt-3 inline-flex items-center rounded-full bg-[#effce9] px-3 py-1 font-heading text-xs font-semibold text-[#00521d]">
            {fulfillmentStatus}
          </span>
        </div>
      </div>

      <a
        target="_blank"
        href={order.statusPageUrl}
        rel="noreferrer"
        className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 font-heading text-sm font-semibold text-white! transition-colors hover:bg-[#8f440b] hover:no-underline! focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#00521d]"
      >
        View order status →
      </a>
    </div>
  );
}

function OrderLineRow({lineItem}: {lineItem: OrderLineItemFullFragment}) {
  return (
    <tr className="border-b border-[#effce9] last:border-b-0">
      <td className={CELL}>
        <div className="flex items-center gap-3">
          {lineItem?.image && (
            <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-[#effce9]">
              <Image data={lineItem.image} width={96} height={96} className="size-full object-cover" />
            </div>
          )}
          <div>
            <p className="m-0 font-medium text-[#004817]">{lineItem.title}</p>
            <small className="text-[#347345]">{lineItem.variantTitle}</small>
          </div>
        </div>
      </td>
      <td className={`${CELL} text-[#347345]`}>
        <Money data={lineItem.price!} />
      </td>
      <td className={`${CELL} text-[#347345]`}>{lineItem.quantity}</td>
      <td className={`${CELL} text-right text-[#004817]`}>
        <Money data={lineItem.totalDiscount!} />
      </td>
    </tr>
  );
}
