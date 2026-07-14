import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {CartLayout} from '~/components/CartMain';
import {CartForm, Money, type OptimisticCart} from '@shopify/hydrogen';
import {useEffect, useId, useRef, useState} from 'react';
import {useFetcher} from 'react-router';
import {ArrowRightIcon} from '~/components/icons';
import {cn} from '~/lib/utils';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
};

const FIELD =
  'w-full rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

const APPLY_BUTTON =
  'flex-none rounded-full bg-white/15 px-4 py-2.5 font-heading text-xs font-extrabold text-white transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50';

const CHIP_REMOVE =
  'text-xs font-semibold text-white/70 underline underline-offset-2 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

export function CartSummary({cart, layout}: CartSummaryProps) {
  const isAside = layout === 'aside';
  const summaryId = useId();
  const codesPanelId = useId();
  const discountsHeadingId = useId();
  const discountCodeInputId = useId();
  const giftCardHeadingId = useId();
  const giftCardInputId = useId();

  const appliedDiscounts =
    cart?.discountCodes?.filter((discount) => discount.applicable) ?? [];
  const appliedGiftCards = cart?.appliedGiftCards ?? [];
  const hasCodes = appliedDiscounts.length > 0 || appliedGiftCards.length > 0;

  const [codesOpen, setCodesOpen] = useState(hasCodes);

  // A code applied from anywhere (including the /cart page in another tab)
  // should never be hidden behind a collapsed disclosure.
  useEffect(() => {
    if (hasCodes) setCodesOpen(true);
  }, [hasCodes]);

  return (
    <div
      aria-labelledby={summaryId}
      className={cn(
        'flex-none bg-[#00521d] px-5 pt-5 text-white',
        isAside
          ? 'mt-2 rounded-tl-[2.25rem] pb-[calc(1.25rem+env(safe-area-inset-bottom))]'
          : 'mt-6 rounded-2xl pb-5',
      )}
    >
      <h4 className="sr-only" id={summaryId}>
        Order summary
      </h4>

      <dl className="m-0 flex items-baseline justify-between">
        <dt className="text-sm font-bold text-[#bfe6c5]">Subtotal</dt>
        <dd className="m-0 font-heading text-xl font-extrabold tracking-[-0.02em]">
          {cart?.cost?.subtotalAmount?.amount ? (
            <Money data={cart.cost.subtotalAmount} />
          ) : (
            '—'
          )}
        </dd>
      </dl>

      <p className="mt-1 text-[0.6875rem] text-[#8fc99a]">
        Shipping &amp; taxes calculated at checkout
      </p>

      <CartCheckoutActions checkoutUrl={cart?.checkoutUrl} />

      <button
        aria-controls={codesPanelId}
        aria-expanded={codesOpen}
        className="mx-auto mt-3 block font-heading text-xs font-extrabold text-[#a4e8aa] underline underline-offset-2 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        onClick={() => setCodesOpen((open) => !open)}
        type="button"
      >
        Have a discount or gift card?
      </button>

      <div className="mt-4 flex flex-col gap-4" hidden={!codesOpen} id={codesPanelId}>
        <CartDiscounts
          appliedDiscounts={appliedDiscounts}
          discountCodeInputId={discountCodeInputId}
          discountsHeadingId={discountsHeadingId}
        />
        <CartGiftCard
          giftCardCodes={cart?.appliedGiftCards}
          giftCardHeadingId={giftCardHeadingId}
          giftCardInputId={giftCardInputId}
        />
      </div>
    </div>
  );
}

function CartCheckoutActions({checkoutUrl}: {checkoutUrl?: string}) {
  if (!checkoutUrl) return null;

  return (
    <a
      className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-3.5 font-heading text-sm font-extrabold text-primary-foreground no-underline transition-colors hover:bg-primary/90 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      href={checkoutUrl}
      target="_self"
    >
      Checkout
      <ArrowRightIcon className="size-4" />
    </a>
  );
}

function CartDiscounts({
  appliedDiscounts,
  discountsHeadingId,
  discountCodeInputId,
}: {
  appliedDiscounts: CartApiQueryFragment['discountCodes'];
  discountsHeadingId: string;
  discountCodeInputId: string;
}) {
  const codes: string[] = appliedDiscounts.map(({code}) => code);
  const discountCodeInput = useRef<HTMLInputElement>(null);
  const discountAddFetcher = useFetcher({key: 'discount-add'});

  useEffect(() => {
    if (discountAddFetcher.data) {
      if (discountCodeInput.current !== null) {
        discountCodeInput.current.value = '';
      }
    }
  }, [discountAddFetcher.data]);

  return (
    <section aria-label="Discounts">
      {codes.length > 0 && (
        <dl className="m-0 mb-2">
          <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-[#8fc99a]" id={discountsHeadingId}>
            Discount
          </dt>
          <UpdateDiscountForm>
            <dd
              aria-labelledby={discountsHeadingId}
              className="m-0 mt-1.5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5"
              role="group"
            >
              <code className="font-heading text-xs font-extrabold text-[#a4e8aa]">
                {codes.join(', ')}
              </code>
              <button aria-label="Remove discount" className={CHIP_REMOVE} type="submit">
                Remove
              </button>
            </dd>
          </UpdateDiscountForm>
        </dl>
      )}

      <UpdateDiscountForm discountCodes={codes} fetcherKey="discount-add">
        <div className="flex gap-2">
          <label className="sr-only" htmlFor={discountCodeInputId}>
            Discount code
          </label>
          <input
            className={FIELD}
            id={discountCodeInputId}
            name="discountCode"
            placeholder="Discount code"
            ref={discountCodeInput}
            type="text"
          />
          <button aria-label="Apply discount code" className={APPLY_BUTTON} type="submit">
            Apply
          </button>
        </div>
      </UpdateDiscountForm>
    </section>
  );
}

function UpdateDiscountForm({
  discountCodes,
  fetcherKey,
  children,
}: {
  discountCodes?: string[];
  fetcherKey?: string;
  children: React.ReactNode;
}) {
  return (
    <CartForm
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      fetcherKey={fetcherKey}
      inputs={{discountCodes: discountCodes || []}}
      route="/cart"
    >
      {children}
    </CartForm>
  );
}

function CartGiftCard({
  giftCardCodes,
  giftCardHeadingId,
  giftCardInputId,
}: {
  giftCardCodes: CartApiQueryFragment['appliedGiftCards'] | undefined;
  giftCardHeadingId: string;
  giftCardInputId: string;
}) {
  const giftCardCodeInput = useRef<HTMLInputElement>(null);
  const removeButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const previousCardIdsRef = useRef<string[]>([]);
  const giftCardAddFetcher = useFetcher({key: 'gift-card-add'});
  const [removedCardIndex, setRemovedCardIndex] = useState<number | null>(null);

  useEffect(() => {
    if (giftCardAddFetcher.data) {
      if (giftCardCodeInput.current !== null) {
        giftCardCodeInput.current.value = '';
      }
    }
  }, [giftCardAddFetcher.data]);

  useEffect(() => {
    const currentCardIds = giftCardCodes?.map((card) => card.id) || [];

    if (removedCardIndex !== null && giftCardCodes) {
      const focusTargetIndex = Math.min(
        removedCardIndex,
        giftCardCodes.length - 1,
      );
      const focusTargetCard = giftCardCodes[focusTargetIndex];
      const focusButton = focusTargetCard
        ? removeButtonRefs.current.get(focusTargetCard.id)
        : null;

      if (focusButton) {
        focusButton.focus();
      } else if (giftCardCodeInput.current) {
        giftCardCodeInput.current.focus();
      }

      setRemovedCardIndex(null);
    }

    previousCardIdsRef.current = currentCardIds;
  }, [giftCardCodes, removedCardIndex]);

  const handleRemoveClick = (cardId: string) => {
    const index = previousCardIdsRef.current.indexOf(cardId);
    if (index !== -1) {
      setRemovedCardIndex(index);
    }
  };

  return (
    <section aria-label="Gift cards">
      {giftCardCodes && giftCardCodes.length > 0 && (
        <dl className="m-0 mb-2">
          <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-[#8fc99a]" id={giftCardHeadingId}>
            Applied gift card(s)
          </dt>
          {giftCardCodes.map((giftCard) => (
            <dd
              className="m-0 mt-1.5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5"
              key={giftCard.id}
            >
              <RemoveGiftCardForm
                buttonRef={(el: HTMLButtonElement | null) => {
                  if (el) {
                    removeButtonRefs.current.set(giftCard.id, el);
                  } else {
                    removeButtonRefs.current.delete(giftCard.id);
                  }
                }}
                giftCardId={giftCard.id}
                lastCharacters={giftCard.lastCharacters}
                onRemoveClick={() => handleRemoveClick(giftCard.id)}
              >
                <code className="font-heading text-xs font-extrabold text-[#a4e8aa]">
                  ***{giftCard.lastCharacters}
                </code>
                <span className="text-xs font-semibold text-white/80">
                  <Money as="span" data={giftCard.amountUsed} />
                </span>
              </RemoveGiftCardForm>
            </dd>
          ))}
        </dl>
      )}

      <AddGiftCardForm fetcherKey="gift-card-add">
        <div className="flex gap-2">
          <label className="sr-only" htmlFor={giftCardInputId}>
            Gift card code
          </label>
          <input
            className={FIELD}
            id={giftCardInputId}
            name="giftCardCode"
            placeholder="Gift card code"
            ref={giftCardCodeInput}
            type="text"
          />
          <button
            aria-label="Apply gift card code"
            className={APPLY_BUTTON}
            disabled={giftCardAddFetcher.state !== 'idle'}
            type="submit"
          >
            Apply
          </button>
        </div>
      </AddGiftCardForm>
    </section>
  );
}

function AddGiftCardForm({
  fetcherKey,
  children,
}: {
  fetcherKey?: string;
  children: React.ReactNode;
}) {
  return (
    <CartForm
      action={CartForm.ACTIONS.GiftCardCodesAdd}
      fetcherKey={fetcherKey}
      route="/cart"
    >
      {children}
    </CartForm>
  );
}

function RemoveGiftCardForm({
  giftCardId,
  lastCharacters,
  children,
  onRemoveClick,
  buttonRef,
}: {
  giftCardId: string;
  lastCharacters: string;
  children: React.ReactNode;
  onRemoveClick?: () => void;
  buttonRef?: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <CartForm
      action={CartForm.ACTIONS.GiftCardCodesRemove}
      inputs={{giftCardCodes: [giftCardId]}}
      route="/cart"
    >
      <span className="inline-flex items-center gap-2">
        {children}
        <button
          aria-label={`Remove gift card ending in ${lastCharacters}`}
          className={CHIP_REMOVE}
          onClick={onRemoveClick}
          ref={buttonRef}
          type="submit"
        >
          Remove
        </button>
      </span>
    </CartForm>
  );
}
