import {Money} from '@shopify/hydrogen';
import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';

function formatSavings(price?: MoneyV2, compareAtPrice?: MoneyV2 | null) {
  if (!price || !compareAtPrice) return null;
  const diff = Number(compareAtPrice.amount) - Number(price.amount);
  if (!(diff > 0)) return null;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: price.currencyCode,
    maximumFractionDigits: Number.isInteger(diff) ? 0 : 2,
  }).format(diff);
}

export function ProductPrice({
  price,
  compareAtPrice,
  availableForSale = true,
}: {
  price?: MoneyV2;
  compareAtPrice?: MoneyV2 | null;
  availableForSale?: boolean;
}) {
  const saved = formatSavings(price, compareAtPrice);

  return (
    <div aria-label="Price" role="group" className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {price ? (
        <span className="font-heading text-4xl font-semibold tracking-[-0.04em] text-primary sm:text-5xl">
          <Money as="span" data={price} />
        </span>
      ) : (
        <span>&nbsp;</span>
      )}
      {compareAtPrice ? (
        <s className="font-heading text-xl text-[#347345]/70">
          <Money as="span" data={compareAtPrice} />
        </s>
      ) : null}
      {saved ? (
        <span className="rounded-full bg-[#00521d] px-3 py-1 font-heading text-xs font-bold uppercase tracking-[0.1em] text-white">
          Save {saved}
        </span>
      ) : null}
      {!availableForSale ? (
        <span className="rounded-full bg-[#f4e2d4] px-3 py-1 font-heading text-xs font-bold uppercase tracking-[0.1em] text-[#8f440b]">
          Sold out
        </span>
      ) : null}
    </div>
  );
}
