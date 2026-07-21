import {useId, useRef, useState, type MouseEvent} from 'react';
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
  isPod = false,
}: {
  productOptions: MappedProductOptions[];
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
  isPod?: boolean;
}) {
  const navigate = useNavigate();
  const {open} = useAside();
  const fieldId = useId();
  const petNameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const confirmationRef = useRef<HTMLInputElement>(null);
  const [quantity, setQuantity] = useState(1);
  const [petName, setPetName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [touched, setTouched] = useState({
    petName: false,
    phoneNumber: false,
    confirmation: false,
  });
  const available = Boolean(selectedVariant?.availableForSale);
  const normalizedPetName = petName.trim();
  const normalizedPhoneNumber = phoneNumber.trim();
  const podDetailsAreValid = Boolean(
    normalizedPetName && normalizedPhoneNumber && confirmed,
  );
  const showPetNameError =
    !normalizedPetName && (attempted || touched.petName);
  const showPhoneError =
    !normalizedPhoneNumber && (attempted || touched.phoneNumber);
  const showConfirmationError =
    !confirmed && (attempted || touched.confirmation);

  const handleAddToCart = (event: MouseEvent<HTMLButtonElement>) => {
    if (isPod && !podDetailsAreValid) {
      event.preventDefault();
      setAttempted(true);

      requestAnimationFrame(() => {
        if (!normalizedPetName) petNameRef.current?.focus();
        else if (!normalizedPhoneNumber) phoneRef.current?.focus();
        else confirmationRef.current?.focus();
      });
      return;
    }

    open('cart');
  };

  const lineAttributes = isPod
    ? [
        {key: 'Pet name', value: normalizedPetName},
        {key: 'Phone number', value: normalizedPhoneNumber},
        {key: '_pod', value: 'true'},
      ]
    : undefined;

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

      {isPod ? (
        <fieldset className="rounded-[1.5rem] rounded-br-[3rem] border border-[#efc27d] bg-[#fff9ed] p-5 sm:p-6">
          <legend className="px-2 font-heading text-sm font-bold uppercase tracking-[0.14em] text-[#754000]">
            Personalize the nameplate
          </legend>
          <p className="mt-1 max-w-[38rem] text-sm leading-relaxed text-[#5e513c]">
            Enter the details exactly as you want them engraved. Both fields are
            required.
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label
                className="mb-2 block font-heading text-sm font-bold text-[#004817]"
                htmlFor={`${fieldId}-pet-name`}
              >
                Pet name
              </label>
              <input
                aria-describedby={`${fieldId}-pet-name-hint${showPetNameError ? ` ${fieldId}-pet-name-error` : ''}`}
                aria-invalid={showPetNameError || undefined}
                autoCapitalize="words"
                autoComplete="off"
                className="min-h-12 w-full rounded-xl border border-[#9a8b72] bg-white px-4 text-base text-[#253529] outline-none transition-colors placeholder:text-[#819084] focus:border-[#00521d] focus-visible:ring-2 focus-visible:ring-[#00521d]/25"
                id={`${fieldId}-pet-name`}
                maxLength={20}
                name="pod-pet-name"
                onBlur={() =>
                  setTouched((current) => ({...current, petName: true}))
                }
                onChange={(event) => setPetName(event.currentTarget.value)}
                placeholder="Cooper"
                ref={petNameRef}
                required
                type="text"
                value={petName}
              />
              <p
                className="mt-1.5 text-xs text-[#6d766e]"
                id={`${fieldId}-pet-name-hint`}
              >
                Up to 20 characters.
              </p>
              {showPetNameError ? (
                <p
                  className="mt-1.5 text-xs font-semibold text-[#a32f1f]"
                  id={`${fieldId}-pet-name-error`}
                  role="alert"
                >
                  Enter the pet name to engrave.
                </p>
              ) : null}
            </div>

            <div>
              <label
                className="mb-2 block font-heading text-sm font-bold text-[#004817]"
                htmlFor={`${fieldId}-phone-number`}
              >
                Phone number
              </label>
              <input
                aria-describedby={`${fieldId}-phone-number-hint${showPhoneError ? ` ${fieldId}-phone-number-error` : ''}`}
                aria-invalid={showPhoneError || undefined}
                autoComplete="tel"
                className="min-h-12 w-full rounded-xl border border-[#9a8b72] bg-white px-4 text-base text-[#253529] outline-none transition-colors placeholder:text-[#819084] focus:border-[#00521d] focus-visible:ring-2 focus-visible:ring-[#00521d]/25"
                id={`${fieldId}-phone-number`}
                inputMode="tel"
                maxLength={30}
                name="pod-phone-number"
                onBlur={() =>
                  setTouched((current) => ({...current, phoneNumber: true}))
                }
                onChange={(event) =>
                  setPhoneNumber(event.currentTarget.value)
                }
                placeholder="619-892-7850"
                ref={phoneRef}
                required
                type="tel"
                value={phoneNumber}
              />
              <p
                className="mt-1.5 text-xs text-[#6d766e]"
                id={`${fieldId}-phone-number-hint`}
              >
                Include the country code for international numbers.
              </p>
              {showPhoneError ? (
                <p
                  className="mt-1.5 text-xs font-semibold text-[#a32f1f]"
                  id={`${fieldId}-phone-number-error`}
                  role="alert"
                >
                  Enter the phone number to engrave.
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#f2d493] p-1 shadow-inner shadow-[#754000]/15">
            <div className="relative min-h-24 rounded-[0.8rem] border border-[#9a6827]/45 bg-[linear-gradient(135deg,#ffe8ad,#e8b95f)] px-10 py-4 text-center text-[#4a2d08] shadow-sm">
              <span
                aria-hidden="true"
                className="absolute left-3 top-1/2 size-2.5 -translate-y-1/2 rounded-full border border-[#8b5c20]/50 bg-[#d8a64e] shadow-inner"
              />
              <span
                aria-hidden="true"
                className="absolute right-3 top-1/2 size-2.5 -translate-y-1/2 rounded-full border border-[#8b5c20]/50 bg-[#d8a64e] shadow-inner"
              />
              <p className="font-heading text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#754000]/75">
                Engraving details
              </p>
              <p className="mt-1 truncate font-heading text-lg font-extrabold uppercase tracking-[0.08em]">
                {normalizedPetName || 'Your pet'}
              </p>
              <p className="mt-0.5 truncate font-heading text-sm font-semibold tracking-[0.05em]">
                {normalizedPhoneNumber || 'Your phone number'}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-[#415346]">
              <input
                aria-describedby={
                  showConfirmationError
                    ? `${fieldId}-confirmation-error`
                    : undefined
                }
                aria-invalid={showConfirmationError || undefined}
                checked={confirmed}
                className="mt-0.5 size-5 shrink-0 accent-[#00521d]"
                name="pod-confirmation"
                onBlur={() =>
                  setTouched((current) => ({
                    ...current,
                    confirmation: true,
                  }))
                }
                onChange={(event) => setConfirmed(event.currentTarget.checked)}
                ref={confirmationRef}
                required
                type="checkbox"
              />
              <span>I checked the spelling and phone number above.</span>
            </label>
            {showConfirmationError ? (
              <p
                className="ml-8 mt-1.5 text-xs font-semibold text-[#a32f1f]"
                id={`${fieldId}-confirmation-error`}
                role="alert"
              >
                Confirm the engraving details before adding this item.
              </p>
            ) : null}
          </div>
        </fieldset>
      ) : null}

      <div className="product-purchase-actions">
        <div className="product-purchase-controls">
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
            onClick={handleAddToCart}
            lines={
              selectedVariant
                ? [
                    {
                      merchandiseId: selectedVariant.id,
                      quantity,
                      selectedVariant,
                      attributes: lineAttributes,
                    },
                  ]
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
        </div>

        {isPod && quantity > 1 ? (
          <p className="mt-2 text-xs leading-relaxed text-[#5c7060]">
            All {quantity} collars will use the same engraving. Add them
            separately for different details.
          </p>
        ) : null}

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
