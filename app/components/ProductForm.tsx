import {useState} from 'react';
import {Link, useNavigate} from 'react-router';
import {type MappedProductOptions} from '@shopify/hydrogen';
import type {Maybe, ProductOptionValueSwatch} from '@shopify/hydrogen/storefront-api-types';
import type {ProductFragment} from 'storefrontapi.generated';
import {LockKeyhole, RotateCcw, ShoppingCart, Truck} from 'lucide-react';
import {AddToCartButton} from './AddToCartButton';
import {QuantitySelector} from './QuantitySelector';
import {useAside} from './Aside';

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

      <div className="product-purchase-actions">
        <div className="product-quantity-row">
          <span className="product-quantity-label">Quantity</span>
          <QuantitySelector
            value={quantity}
            onChange={setQuantity}
            disabled={!available}
          />
        </div>
        <AddToCartButton
          disabled={!available}
          onClick={() => open('cart')}
          lines={
            selectedVariant
              ? [{merchandiseId: selectedVariant.id, quantity, selectedVariant}]
              : []
          }
          className={`product-add-to-cart ${FOCUS_RING}`}
        >
          {available ? (
            <ShoppingCart
              aria-hidden="true"
              className="size-5"
              strokeWidth={2.25}
            />
          ) : null}
          <span>{available ? 'Add to cart' : 'Sold out'}</span>
        </AddToCartButton>

        <aside
          className="product-assurance"
          aria-labelledby="product-assurance-title"
        >
          <p id="product-assurance-title" className="product-assurance__title">
            The Pawstie Promise
          </p>
          <ul className="product-assurance__list">
            <li className="product-assurance__item">
              <LockKeyhole
                aria-hidden="true"
                className="product-assurance__icon"
              />
              <span>
                <strong>Secure Shopify checkout</strong>
                <small>Protected payment processing.</small>
              </span>
            </li>
            <li className="product-assurance__item">
              <Truck aria-hidden="true" className="product-assurance__icon" />
              <span>
                <strong>Shipping rates at checkout</strong>
                <small>
                  Rates shown before you pay.{' '}
                  <Link to="/policies/shipping-policy">View policy</Link>
                </small>
              </span>
            </li>
            <li className="product-assurance__item">
              <RotateCcw
                aria-hidden="true"
                className="product-assurance__icon"
              />
              <span>
                <strong>Easy returns</strong>
                <small>
                  Simple support when plans change.{' '}
                  <Link to="/policies/refund-policy">View policy</Link>
                </small>
              </span>
            </li>
          </ul>
        </aside>
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
