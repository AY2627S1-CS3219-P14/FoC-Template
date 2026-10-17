import { useMemo, useState, type FormEvent } from 'react'
import { useLocation, useSearchParams } from 'react-router'
import { CreditOfferCard } from '../components/errands/CreditOfferCard'
import { FormField } from '../components/ui/FormField'
import {
  MOCK_AVAILABLE_CREDITS,
  MOCK_DELIVERY_BUILDINGS,
  MOCK_ERRAND_SUPPLIERS,
} from '../features/errands/errand.mock'
import type {
  ErrandDraft,
  ErrandDraftErrors,
  ErrandDraftField,
  ErrandSupplierOption,
} from '../features/errands/errand.types'

type SupplierNavigationState = {
  supplier?: ErrandSupplierOption
}

const inputClassName =
  'h-12 w-full rounded-xl border border-[#dde3de] bg-white px-3.5 text-sm text-[#17211d] outline-none transition placeholder:text-[#929c95] focus:border-[#175c45] focus:ring-4 focus:ring-[#175c45]/10 aria-invalid:border-[#d92d20] aria-invalid:ring-[#d92d20]/10'

const textareaClassName = `${inputClassName} h-[82px] resize-y py-3.5 leading-5`

function toLocalDateTimeValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 16)
}

function validateDraft(draft: ErrandDraft, availableCredits: number) {
  const errors: ErrandDraftErrors = {}
  const creditValue = Number(draft.creditValue)
  const expiresAt = new Date(draft.expiresAt)
  const now = new Date()
  const maximumExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  if (!draft.supplierId) errors.supplierId = 'Choose a pickup supplier.'
  if (!draft.requiredItem.trim()) errors.requiredItem = 'Describe the items you need.'
  if (!draft.deliveryBuildingId) errors.deliveryBuildingId = 'Choose a delivery building.'
  if (!draft.deliveryFloor.trim()) errors.deliveryFloor = 'Enter the delivery floor.'
  if (!draft.deliveryDescription.trim()) {
    errors.deliveryDescription = 'Add instructions so the courier can find you.'
  }

  if (!draft.expiresAt || Number.isNaN(expiresAt.getTime())) {
    errors.expiresAt = 'Choose a collection deadline.'
  } else if (expiresAt <= now) {
    errors.expiresAt = 'The collection deadline must be in the future.'
  } else if (expiresAt > maximumExpiry) {
    errors.expiresAt = 'The collection deadline cannot be more than seven days away.'
  }

  if (!Number.isInteger(creditValue) || creditValue < 1) {
    errors.creditValue = 'Enter a whole number of at least 1 credit.'
  } else if (creditValue > availableCredits) {
    errors.creditValue = `You only have ${availableCredits} credits available.`
  }

  return errors
}

export function CreateErrandPage() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigationSupplier = (location.state as SupplierNavigationState | null)?.supplier
  const requestedSupplierId = searchParams.get('supplierId') ?? ''

  const suppliers = useMemo(() => {
    if (
      !navigationSupplier ||
      MOCK_ERRAND_SUPPLIERS.some((supplier) => supplier.id === navigationSupplier.id)
    ) {
      return MOCK_ERRAND_SUPPLIERS
    }

    return [navigationSupplier, ...MOCK_ERRAND_SUPPLIERS]
  }, [navigationSupplier])

  const initialSupplierId = suppliers.some((supplier) => supplier.id === requestedSupplierId)
    ? requestedSupplierId
    : ''

  const [draft, setDraft] = useState<ErrandDraft>({
    supplierId: initialSupplierId,
    requiredItem: '',
    deliveryBuildingId: '',
    deliveryFloor: '',
    deliveryDescription: '',
    expiresAt: '',
    creditValue: '12',
  })
  const [errors, setErrors] = useState<ErrandDraftErrors>({})
  const [previewMessage, setPreviewMessage] = useState<string | null>(null)

  const selectedSupplier = suppliers.find((supplier) => supplier.id === draft.supplierId)
  const dateBounds = useMemo(() => {
    const now = new Date()
    return {
      min: toLocalDateTimeValue(now),
      max: toLocalDateTimeValue(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)),
    }
  }, [])

  function updateDraft(field: ErrandDraftField, value: string) {
    setDraft((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setPreviewMessage(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateDraft(draft, MOCK_AVAILABLE_CREDITS)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setPreviewMessage(null)
      const firstInvalidField = Object.keys(nextErrors)[0]
      document.querySelector<HTMLElement>(`[name="${firstInvalidField}"]`)?.focus()
      return
    }

    setPreviewMessage('Frontend preview only — no errand was created.')
  }

  return (
    <section>
      <div>
        <p className="text-xs font-medium tracking-[0.04em] text-[#175c45] sm:text-sm">
          NEW REQUEST
        </p>
        <h1 className="mt-2 text-[2rem] font-medium leading-tight tracking-[-0.035em] text-[#17211d] sm:text-[2.375rem]">
          Create an errand
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68736c] sm:text-base">
          Tell couriers what you need and where it should go.
        </p>
      </div>

      <form
        className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_326px] xl:gap-6"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="rounded-[18px] border border-[#dde3de] bg-white p-4 shadow-[0_8px_24px_rgba(22,59,42,0.07)] sm:p-6">
          <h2 className="text-xl font-medium tracking-[-0.015em] text-[#17211d] sm:text-2xl">
            What do you need?
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <FormField
              htmlFor="supplier-id"
              label="Pickup supplier"
              error={errors.supplierId}
              required
            >
              <select
                id="supplier-id"
                name="supplierId"
                value={draft.supplierId}
                onChange={(event) => updateDraft('supplierId', event.target.value)}
                aria-invalid={Boolean(errors.supplierId)}
                aria-describedby={errors.supplierId ? 'supplier-id-error' : undefined}
                className={`${inputClassName} cursor-pointer`}
              >
                <option value="">Select a supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField htmlFor="supplier-category" label="Category">
              <input
                id="supplier-category"
                type="text"
                value={selectedSupplier?.category ?? ''}
                placeholder="Choose a supplier first"
                readOnly
                aria-readonly="true"
                className={`${inputClassName} cursor-default bg-[#f8faf8] text-[#68736c]`}
              />
            </FormField>
          </div>

          <div className="mt-4">
            <FormField
              htmlFor="required-item"
              label="Requested items"
              error={errors.requiredItem}
              required
            >
              <textarea
                id="required-item"
                name="requiredItem"
                value={draft.requiredItem}
                onChange={(event) => updateDraft('requiredItem', event.target.value)}
                placeholder="e.g. Two sandwiches and one coffee"
                aria-invalid={Boolean(errors.requiredItem)}
                aria-describedby={errors.requiredItem ? 'required-item-error' : undefined}
                className={textareaClassName}
              />
            </FormField>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_9rem]">
            <FormField
              htmlFor="delivery-building"
              label="Delivery building"
              error={errors.deliveryBuildingId}
              required
            >
              <select
                id="delivery-building"
                name="deliveryBuildingId"
                value={draft.deliveryBuildingId}
                onChange={(event) => updateDraft('deliveryBuildingId', event.target.value)}
                aria-invalid={Boolean(errors.deliveryBuildingId)}
                aria-describedby={
                  errors.deliveryBuildingId ? 'delivery-building-error' : undefined
                }
                className={`${inputClassName} cursor-pointer`}
              >
                <option value="">Select a building</option>
                {MOCK_DELIVERY_BUILDINGS.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              htmlFor="delivery-floor"
              label="Floor"
              error={errors.deliveryFloor}
              required
            >
              <input
                id="delivery-floor"
                name="deliveryFloor"
                type="text"
                value={draft.deliveryFloor}
                onChange={(event) => updateDraft('deliveryFloor', event.target.value)}
                placeholder="e.g. 3"
                aria-invalid={Boolean(errors.deliveryFloor)}
                aria-describedby={errors.deliveryFloor ? 'delivery-floor-error' : undefined}
                className={inputClassName}
              />
            </FormField>
          </div>

          <div className="mt-4">
            <FormField
              htmlFor="expires-at"
              label="Collect before"
              error={errors.expiresAt}
              hint="Choose a time within the next seven days."
              required
            >
              <input
                id="expires-at"
                name="expiresAt"
                type="datetime-local"
                min={dateBounds.min}
                max={dateBounds.max}
                value={draft.expiresAt}
                onChange={(event) => updateDraft('expiresAt', event.target.value)}
                aria-invalid={Boolean(errors.expiresAt)}
                aria-describedby={errors.expiresAt ? 'expires-at-error' : 'expires-at-hint'}
                className={inputClassName}
              />
            </FormField>
          </div>

          <div className="mt-4">
            <FormField
              htmlFor="delivery-description"
              label="Delivery instructions"
              error={errors.deliveryDescription}
              required
            >
              <textarea
                id="delivery-description"
                name="deliveryDescription"
                value={draft.deliveryDescription}
                onChange={(event) => updateDraft('deliveryDescription', event.target.value)}
                placeholder="e.g. Meet outside room 03-12 and message me when you arrive"
                aria-invalid={Boolean(errors.deliveryDescription)}
                aria-describedby={
                  errors.deliveryDescription ? 'delivery-description-error' : undefined
                }
                className={textareaClassName}
              />
            </FormField>
          </div>
        </div>

        <aside className="space-y-3.5 xl:sticky xl:top-[106px]">
          <CreditOfferCard
            availableCredits={MOCK_AVAILABLE_CREDITS}
            value={draft.creditValue}
            error={errors.creditValue}
            onChange={(value) => updateDraft('creditValue', value)}
          />

          <button
            type="submit"
            className="flex h-12 w-full cursor-pointer items-center justify-center rounded-lg bg-[#d8f06b] px-4 text-sm font-semibold text-[#0d3c2d] transition hover:bg-[#cce85b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#175c45]"
          >
            Create errand
          </button>

          {previewMessage ? (
            <p className="rounded-xl bg-[#ddf3e7] px-4 py-3 text-sm text-[#175c45]" role="status">
              {previewMessage}
            </p>
          ) : null}
        </aside>
      </form>
    </section>
  )
}
