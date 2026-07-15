import {useState} from 'react';
import {Link, useNavigate} from 'react-router';
import {type MappedProductOptions} from '@shopify/hydrogen';
import type {Maybe, ProductOptionValueSwatch} from '@shopify/hydrogen/storefront-api-types';
import type {ProductFragment} from 'storefrontapi.generated';
import {AddToCartButton} from './AddToCartButton';
import {QuantitySelector} from './QuantitySelector';
import {useAside} from './Aside';
import {ArrowRightIcon} from './icons';

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#00521d]';

export function ProductForm({
  productOptions,
  selectedVariant,
}: {
  productOptions: MappedProductOptions[];
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
}) {
  const navigate = useNavigate();
  const {open} = useAside();
  const [quantity, setQuantity] = useState(1);
  const available = Boolean(selectedVariant?.availableForSale);

  return (
    <div className="relative z-10 flex flex-col gap-6">
      {productOptions.map((option) => {
        if (option.optionValues.length === 1) return null;
        return (
          <div key={option.name}>
            <span className="mb-3 block font-heading text-sm font-bold uppercase tracking-[0.16em] text-[#347345]">
              {option.name}
            </span>
            <div className="flex flex-wrap gap-3">
              {option.optionValues.map((value) => {
                const {name, handle, variantUriQuery, selected, available: valueAvailable, exists, isDifferentProduct, swatch} = value;
                const pill = `inline-flex min-h-11 items-center rounded-full px-4 font-heading text-sm font-semibold transition-colors ${FOCUS_RING} ${selected ? 'bg-[#00521d] text-white' : 'text-[#00521d] ring-1 ring-[#bfe9bb] hover:bg-[#effce9]'} ${valueAvailable ? '' : 'opacity-40 line-through'} motion-reduce:transition-none`;
                if (isDifferentProduct) {
                  return <Link key={option.name + name} prefetch="intent" preventScrollReset replace to={`/products/${handle}?${variantUriQuery}`} className={pill}><ProductOptionSwatch swatch={swatch} name={name} /></Link>;
                }
                return <button type="button" key={option.name + name} className={pill} disabled={!exists} onClick={() => { if (!selected) void navigate(`?${variantUriQuery}`, {replace: true, preventScrollReset: true}); }}><ProductOptionSwatch swatch={swatch} name={name} /></button>;
              })}
            </div>
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-4">
        <QuantitySelector value={quantity} onChange={setQuantity} disabled={!available} />
        <AddToCartButton
          disabled={!available}
          onClick={() => open('cart')}
          lines={selectedVariant ? [{merchandiseId: selectedVariant.id, quantity, selectedVariant}] : []}
          className={`group inline-flex min-h-14 items-center gap-4 rounded-full bg-primary py-2 pl-8 pr-2 font-heading text-lg font-semibold text-white! shadow-[0_12px_28px_-10px_rgba(169,83,14,0.5)] transition-[transform,box-shadow,background-color] duration-300 hover:-translate-y-0.5 hover:bg-[#8f440b] hover:shadow-[0_20px_38px_-12px_rgba(169,83,14,0.65)] ${FOCUS_RING} disabled:cursor-not-allowed disabled:bg-[#c7bcae] disabled:text-white! disabled:shadow-none disabled:hover:translate-y-0 motion-reduce:transition-none`}
        >
          {available ? 'Add to cart' : 'Sold out'}
          {available ? <span className="relative grid size-10 place-items-center overflow-hidden rounded-full bg-white text-primary"><ArrowRightIcon className="size-4 transition-transform duration-300 motion-safe:group-hover:translate-x-[220%]" /><ArrowRightIcon className="absolute size-4 -translate-x-[220%] transition-transform duration-300 motion-safe:group-hover:translate-x-0" /></span> : null}
        </AddToCartButton>
      </div>
    </div>
  );
}

function ProductOptionSwatch({swatch, name}: {swatch?: Maybe<ProductOptionValueSwatch> | undefined; name: string}) {
  const image = swatch?.image?.previewImage?.url;
  const color = swatch?.color;
  if (!image && !color) return name;
  return <span aria-label={name} className="block size-6 overflow-hidden rounded-full" style={{backgroundColor: color || 'transparent'}}>{image ? <img src={image} alt={name} className="size-full rounded-none! object-cover" /> : null}</span>;
}
