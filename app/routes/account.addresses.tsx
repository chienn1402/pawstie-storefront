import type {CustomerAddressInput} from '@shopify/hydrogen/customer-account-api-types';
import type {
  AddressFragment,
  CustomerFragment,
} from 'customer-accountapi.generated';
import {useCallback, useEffect, useRef, useState} from 'react';
import {
  data,
  Form,
  useActionData,
  useNavigation,
  useOutletContext,
  type Fetcher,
} from 'react-router';
import type {Route} from './+types/account.addresses';
import {PlusIcon, StarIcon} from '~/components/icons';
import {Modal} from '~/components/ui/Modal';
import {
  UPDATE_ADDRESS_MUTATION,
  DELETE_ADDRESS_MUTATION,
  CREATE_ADDRESS_MUTATION,
} from '~/graphql/customer-account/CustomerAddressMutations';

const NEW_ADDRESS_ID = 'NEW_ADDRESS_ID';

export type ActionResponse = {
  addressId?: string | null;
  createdAddress?: AddressFragment;
  defaultAddress?: string | null;
  deletedAddress?: string | null;
  error: Record<AddressFragment['id'], string> | null;
  updatedAddress?: AddressFragment;
};

export const meta: Route.MetaFunction = () => {
  return [{title: 'Addresses'}];
};

export async function loader({context}: Route.LoaderArgs) {
  await context.customerAccount.handleAuthStatus();

  return {};
}

export async function action({request, context}: Route.ActionArgs) {
  const {customerAccount} = context;

  try {
    const form = await request.formData();

    const addressId = form.has('addressId')
      ? String(form.get('addressId'))
      : null;
    if (!addressId) {
      throw new Error('You must provide an address id.');
    }

    // this will ensure redirecting to login never happen for mutatation
    const isLoggedIn = await customerAccount.isLoggedIn();
    if (!isLoggedIn) {
      return data(
        {error: {[addressId]: 'Unauthorized'}},
        {
          status: 401,
        },
      );
    }

    const defaultAddress = form.has('defaultAddress')
      ? String(form.get('defaultAddress')) === 'on'
      : false;
    const address: CustomerAddressInput = {};
    const keys: (keyof CustomerAddressInput)[] = [
      'address1',
      'address2',
      'city',
      'company',
      'territoryCode',
      'firstName',
      'lastName',
      'phoneNumber',
      'zoneCode',
      'zip',
    ];

    for (const key of keys) {
      const value = form.get(key);
      if (typeof value === 'string') {
        address[key] = value;
      }
    }

    switch (request.method) {
      case 'POST': {
        // handle new address creation
        try {
          const {data, errors} = await customerAccount.mutate(
            CREATE_ADDRESS_MUTATION,
            {
              variables: {
                address,
                defaultAddress,
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressCreate?.userErrors?.length) {
            throw new Error(data?.customerAddressCreate?.userErrors[0].message);
          }

          if (!data?.customerAddressCreate?.customerAddress) {
            throw new Error('Customer address create failed.');
          }

          return {
            error: null,
            createdAddress: data?.customerAddressCreate?.customerAddress,
            defaultAddress,
          };
        } catch (error: unknown) {
          if (error instanceof Error) {
            return data(
              {error: {[addressId]: error.message}},
              {
                status: 400,
              },
            );
          }
          return data(
            {error: {[addressId]: error}},
            {
              status: 400,
            },
          );
        }
      }

      case 'PUT': {
        // handle address updates
        try {
          const {data, errors} = await customerAccount.mutate(
            UPDATE_ADDRESS_MUTATION,
            {
              variables: {
                address,
                addressId: decodeURIComponent(addressId),
                defaultAddress,
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressUpdate?.userErrors?.length) {
            throw new Error(data?.customerAddressUpdate?.userErrors[0].message);
          }

          if (!data?.customerAddressUpdate?.customerAddress) {
            throw new Error('Customer address update failed.');
          }

          return {
            error: null,
            updatedAddress: address,
            defaultAddress,
          };
        } catch (error: unknown) {
          if (error instanceof Error) {
            return data(
              {error: {[addressId]: error.message}},
              {
                status: 400,
              },
            );
          }
          return data(
            {error: {[addressId]: error}},
            {
              status: 400,
            },
          );
        }
      }

      case 'DELETE': {
        // handles address deletion
        try {
          const {data, errors} = await customerAccount.mutate(
            DELETE_ADDRESS_MUTATION,
            {
              variables: {
                addressId: decodeURIComponent(addressId),
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressDelete?.userErrors?.length) {
            throw new Error(data?.customerAddressDelete?.userErrors[0].message);
          }

          if (!data?.customerAddressDelete?.deletedAddressId) {
            throw new Error('Customer address delete failed.');
          }

          return {error: null, deletedAddress: addressId};
        } catch (error: unknown) {
          if (error instanceof Error) {
            return data(
              {error: {[addressId]: error.message}},
              {
                status: 400,
              },
            );
          }
          return data(
            {error: {[addressId]: error}},
            {
              status: 400,
            },
          );
        }
      }

      default: {
        return data(
          {error: {[addressId]: 'Method not allowed'}},
          {
            status: 405,
          },
        );
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return data(
        {error: error.message},
        {
          status: 400,
        },
      );
    }
    return data(
      {error},
      {
        status: 400,
      },
    );
  }
}

type DialogState = {
  mode: 'new' | 'edit';
  addressId: AddressFragment['id'];
  address: CustomerAddressInput;
  defaultAddress: CustomerFragment['defaultAddress'];
};

export default function Addresses() {
  const {customer} = useOutletContext<{customer: CustomerFragment}>();
  const {defaultAddress, addresses} = customer;
  const count = addresses.nodes.length;
  const action = useActionData<ActionResponse>();

  const [open, setOpen] = useState(false);
  // Retained even while closed so the dialog keeps its contents during the
  // slide-out transition.
  const [dialog, setDialog] = useState<DialogState | null>(null);
  // Two-step delete confirmation, reset each time the dialog is opened/closed.
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const openNew = useCallback(() => {
    setDialog({
      mode: 'new',
      addressId: NEW_ADDRESS_ID,
      address: emptyAddress,
      defaultAddress: null,
    });
    setConfirmingDelete(false);
    setOpen(true);
  }, []);

  const openEdit = useCallback(
    (address: AddressFragment) => {
      setDialog({mode: 'edit', addressId: address.id, address, defaultAddress});
      setConfirmingDelete(false);
      setOpen(true);
    },
    [defaultAddress],
  );

  const close = useCallback(() => {
    setConfirmingDelete(false);
    setOpen(false);
  }, []);

  // Close the dialog after any successful mutation (create, save, or delete).
  // On error the dialog stays open so the message is visible inside the form.
  useEffect(() => {
    if (action?.error === null) setOpen(false);
  }, [action]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="mb-0 font-heading text-2xl font-semibold text-[#004817]">
            Your addresses
          </h2>
          <p className="mt-1 text-sm text-[#347345]">
            {count === 0
              ? 'No addresses saved yet.'
              : `${count} saved address${count === 1 ? '' : 'es'}.`}
          </p>
        </div>
        <button type="button" onClick={openNew} className={SUBMIT_BUTTON}>
          <PlusIcon className="mr-2 size-4" />
          Add a new address
        </button>
      </div>

      {count === 0 ? (
        <p className="text-[#347345]">
          Add an address to speed up checkout next time.
        </p>
      ) : (
        <ExistingAddresses
          addresses={addresses}
          defaultAddress={defaultAddress}
          onEdit={openEdit}
        />
      )}

      <Modal
        open={open}
        onClose={close}
        heading={dialog?.mode === 'edit' ? 'Edit address' : 'Add a new address'}
      >
        {dialog ? (
          <AddressForm
            key={`${dialog.mode}-${dialog.addressId}`}
            addressId={dialog.addressId}
            address={dialog.address}
            defaultAddress={dialog.defaultAddress}
          >
            {({stateForMethod}) =>
              dialog.mode === 'new' ? (
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    disabled={stateForMethod('POST') !== 'idle'}
                    formMethod="POST"
                    type="submit"
                    className={SUBMIT_BUTTON}
                  >
                    {stateForMethod('POST') !== 'idle'
                      ? 'Creating…'
                      : 'Create address'}
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    className={GHOST_BUTTON}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <EditActions
                  stateForMethod={stateForMethod}
                  onCancel={close}
                  confirming={confirmingDelete}
                  onConfirmingChange={setConfirmingDelete}
                />
              )
            }
          </AddressForm>
        ) : null}
      </Modal>
    </div>
  );
}

const OUTLINE_BUTTON =
  'inline-flex min-h-11 items-center justify-center rounded-full border border-destructive/40 px-6 font-heading text-sm font-semibold text-destructive transition-colors duration-200 hover:bg-destructive/10 hover:no-underline! focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#00521d] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none';
const SUBMIT_BUTTON =
  'inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 font-heading text-sm font-semibold text-white! transition-colors duration-200 hover:bg-[#8f440b] hover:no-underline! focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#00521d] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none';
const GHOST_BUTTON =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#cdeccb] px-6 font-heading text-sm font-semibold text-[#00521d] transition-colors duration-200 hover:bg-[#effce9] hover:no-underline! focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#00521d] motion-reduce:transition-none';
const DESTRUCTIVE_BUTTON =
  'inline-flex min-h-11 items-center justify-center rounded-full bg-destructive px-6 font-heading text-sm font-semibold text-white! transition-colors duration-200 hover:bg-destructive/90 hover:no-underline! focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#00521d] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none';

function EditActions({
  stateForMethod,
  onCancel,
  confirming,
  onConfirmingChange,
}: {
  stateForMethod: (method: 'PUT' | 'POST' | 'DELETE') => Fetcher['state'];
  onCancel: () => void;
  confirming: boolean;
  onConfirmingChange: (value: boolean) => void;
}) {
  // Move focus to the safe (non-destructive) action when the confirmation
  // appears, so keyboard/screen-reader users aren't left on the removed button.
  const keepRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (confirming) keepRef.current?.focus();
  }, [confirming]);

  if (confirming) {
    const deleting = stateForMethod('DELETE') !== 'idle';
    return (
      <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
        <p className="font-heading text-sm font-semibold text-destructive">
          Delete this address? This can’t be undone.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            disabled={deleting}
            formMethod="DELETE"
            type="submit"
            className={DESTRUCTIVE_BUTTON}
          >
            {deleting ? 'Deleting…' : 'Yes, delete'}
          </button>
          <button
            ref={keepRef}
            disabled={deleting}
            onClick={() => onConfirmingChange(false)}
            type="button"
            className={GHOST_BUTTON}
          >
            Keep address
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <button
        disabled={stateForMethod('PUT') !== 'idle'}
        formMethod="PUT"
        type="submit"
        className={SUBMIT_BUTTON}
      >
        {stateForMethod('PUT') !== 'idle' ? 'Saving…' : 'Save'}
      </button>
      <button type="button" onClick={onCancel} className={GHOST_BUTTON}>
        Cancel
      </button>
      <button
        type="button"
        onClick={() => onConfirmingChange(true)}
        className={`ml-auto ${OUTLINE_BUTTON}`}
      >
        Delete
      </button>
    </div>
  );
}

const emptyAddress = {
  address1: '',
  address2: '',
  city: '',
  company: '',
  territoryCode: '',
  firstName: '',
  id: 'new',
  lastName: '',
  phoneNumber: '',
  zoneCode: '',
  zip: '',
} as CustomerAddressInput;

function ExistingAddresses({
  addresses,
  defaultAddress,
  onEdit,
}: Pick<CustomerFragment, 'addresses' | 'defaultAddress'> & {
  onEdit: (address: AddressFragment) => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {addresses.nodes.map((address) => (
        <AddressCard
          key={address.id}
          address={address}
          defaultAddress={defaultAddress}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

function AddressCard({
  address,
  defaultAddress,
  onEdit,
}: {
  address: AddressFragment;
  defaultAddress: CustomerFragment['defaultAddress'];
  onEdit: (address: AddressFragment) => void;
}) {
  const isDefault = defaultAddress?.id === address.id;

  const name = [address.firstName, address.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  const locality = [address.city, address.zoneCode, address.zip]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="flex items-start justify-between gap-4 rounded-[2rem] border border-[#cdeccb] bg-white p-6 sm:p-8">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-heading text-base font-semibold text-[#004817]">
            {name || 'Address'}
          </p>
          {isDefault ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#effce9] px-3 py-1 font-heading text-xs font-semibold text-[#00521d]">
              <StarIcon className="size-3" />
              Default
            </span>
          ) : null}
        </div>
        <div className="mt-2 space-y-0.5 text-sm text-[#347345]">
          {address.address1 ? <p>{address.address1}</p> : null}
          {address.address2 ? <p>{address.address2}</p> : null}
          {locality ? <p>{locality}</p> : null}
          {address.territoryCode ? <p>{address.territoryCode}</p> : null}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onEdit(address)}
        className={`shrink-0 ${GHOST_BUTTON}`}
      >
        Edit
      </button>
    </div>
  );
}

const FIELD_LABEL =
  'mb-1.5 block font-heading text-sm font-semibold text-[#00521d]';
const FIELD_INPUT =
  'w-full rounded-2xl border border-[#cdeccb] bg-white px-4 py-3 text-sm text-[#004817] placeholder:text-[#7fa688] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00521d]';

export function AddressForm({
  addressId,
  address,
  defaultAddress,
  children,
}: {
  addressId: AddressFragment['id'];
  address: CustomerAddressInput;
  defaultAddress: CustomerFragment['defaultAddress'];
  children: (props: {
    stateForMethod: (method: 'PUT' | 'POST' | 'DELETE') => Fetcher['state'];
  }) => React.ReactNode;
}) {
  const {state, formMethod} = useNavigation();
  const action = useActionData<ActionResponse>();
  const error = action?.error?.[addressId];
  const isDefaultAddress = defaultAddress?.id === addressId;
  return (
    <Form id={addressId}>
      <fieldset className="grid gap-5 sm:grid-cols-2">
        <input type="hidden" name="addressId" defaultValue={addressId} />
        <div>
          <label htmlFor={`firstName-${addressId}`} className={FIELD_LABEL}>
            First name*
          </label>
          <input
            aria-label="First name"
            autoComplete="given-name"
            defaultValue={address?.firstName ?? ''}
            id={`firstName-${addressId}`}
            name="firstName"
            placeholder="First name"
            required
            type="text"
            className={FIELD_INPUT}
          />
        </div>
        <div>
          <label htmlFor={`lastName-${addressId}`} className={FIELD_LABEL}>
            Last name*
          </label>
          <input
            aria-label="Last name"
            autoComplete="family-name"
            defaultValue={address?.lastName ?? ''}
            id={`lastName-${addressId}`}
            name="lastName"
            placeholder="Last name"
            required
            type="text"
            className={FIELD_INPUT}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`company-${addressId}`} className={FIELD_LABEL}>
            Company
          </label>
          <input
            aria-label="Company"
            autoComplete="organization"
            defaultValue={address?.company ?? ''}
            id={`company-${addressId}`}
            name="company"
            placeholder="Company"
            type="text"
            className={FIELD_INPUT}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`address1-${addressId}`} className={FIELD_LABEL}>
            Address line*
          </label>
          <input
            aria-label="Address line 1"
            autoComplete="address-line1"
            defaultValue={address?.address1 ?? ''}
            id={`address1-${addressId}`}
            name="address1"
            placeholder="Address line 1"
            required
            type="text"
            className={FIELD_INPUT}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`address2-${addressId}`} className={FIELD_LABEL}>
            Address line 2
          </label>
          <input
            aria-label="Address line 2"
            autoComplete="address-line2"
            defaultValue={address?.address2 ?? ''}
            id={`address2-${addressId}`}
            name="address2"
            placeholder="Address line 2"
            type="text"
            className={FIELD_INPUT}
          />
        </div>
        <div>
          <label htmlFor={`city-${addressId}`} className={FIELD_LABEL}>
            City*
          </label>
          <input
            aria-label="City"
            autoComplete="address-level2"
            defaultValue={address?.city ?? ''}
            id={`city-${addressId}`}
            name="city"
            placeholder="City"
            required
            type="text"
            className={FIELD_INPUT}
          />
        </div>
        <div>
          <label htmlFor={`zoneCode-${addressId}`} className={FIELD_LABEL}>
            State / Province*
          </label>
          <input
            aria-label="State/Province"
            autoComplete="address-level1"
            defaultValue={address?.zoneCode ?? ''}
            id={`zoneCode-${addressId}`}
            name="zoneCode"
            placeholder="State / Province"
            required
            type="text"
            className={FIELD_INPUT}
          />
        </div>
        <div>
          <label htmlFor={`zip-${addressId}`} className={FIELD_LABEL}>
            Zip / Postal Code*
          </label>
          <input
            aria-label="Zip"
            autoComplete="postal-code"
            defaultValue={address?.zip ?? ''}
            id={`zip-${addressId}`}
            name="zip"
            placeholder="Zip / Postal Code"
            required
            type="text"
            className={FIELD_INPUT}
          />
        </div>
        <div>
          <label htmlFor={`territoryCode-${addressId}`} className={FIELD_LABEL}>
            Country Code*
          </label>
          <input
            aria-label="Country code"
            autoComplete="country"
            defaultValue={address?.territoryCode ?? ''}
            id={`territoryCode-${addressId}`}
            name="territoryCode"
            placeholder="Country"
            required
            type="text"
            maxLength={2}
            className={FIELD_INPUT}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`phoneNumber-${addressId}`} className={FIELD_LABEL}>
            Phone
          </label>
          <input
            aria-label="Phone Number"
            autoComplete="tel"
            defaultValue={address?.phoneNumber ?? ''}
            id={`phoneNumber-${addressId}`}
            name="phoneNumber"
            placeholder="+16135551111"
            pattern="^\+?[1-9]\d{3,14}$"
            type="tel"
            className={FIELD_INPUT}
          />
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <input
            defaultChecked={isDefaultAddress}
            id={`defaultAddress-${addressId}`}
            name="defaultAddress"
            type="checkbox"
            className="size-4 rounded border-[#cdeccb] text-[#00521d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00521d]"
          />
          <label
            htmlFor={`defaultAddress-${addressId}`}
            className="font-heading text-sm font-semibold text-[#00521d]"
          >
            Set as default address
          </label>
        </div>
      </fieldset>
      {error ? (
        <p role="alert" className="mt-4 text-sm font-semibold text-destructive">
          {error}
        </p>
      ) : null}
      {children({
        stateForMethod: (method) => (formMethod === method ? state : 'idle'),
      })}
    </Form>
  );
}
