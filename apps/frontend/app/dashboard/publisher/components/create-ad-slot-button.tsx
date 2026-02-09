'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useFormState } from 'react-dom';
import { toast } from 'sonner';
import {
  createAdSlotAction,
  type PublisherFormState,
} from '../actions';
import { SubmitButton } from './submit-button';

const AD_SLOT_TYPES = ['DISPLAY', 'VIDEO', 'NATIVE', 'NEWSLETTER', 'PODCAST'];
const initialState: PublisherFormState = {};

export function CreateAdSlotButton() {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [state, formAction] = useFormState(createAdSlotAction, initialState);

  const closeModal = useCallback(() => {
    setOpen(false);
  }, []);

  const prevStateRef = useRef(state);
  useEffect(() => {
    if (state?.success && state !== prevStateRef.current && open) {
      toast.success('Ad slot created successfully');
      queueMicrotask(closeModal);
    }
    if (state?.error && state !== prevStateRef.current) {
      toast.error(state.error);
    }
    prevStateRef.current = state;
  }, [state, open, closeModal]);
  const openModal = useCallback(() => {
    setFormKey((k) => k + 1);
    setOpen(true);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="rounded-lg bg-[--color-primary] px-4 py-2 text-sm font-medium text-white hover:bg-[--color-primary-hover]"
      >
        Create Ad Slot
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" aria-modal="true">
          <div className="w-full max-w-md rounded-lg bg-[--color-background] p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">Create Ad Slot</h2>
            <form key={formKey} action={formAction} className="space-y-4">
              {state?.error && (
                <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">
                  {state.error}
                </div>
              )}
              <div>
                <label htmlFor="create-name" className="mb-1 block text-sm font-medium">
                  Name *
                </label>
                <input
                  id="create-name"
                  name="name"
                  required
                  className="w-full rounded border border-[--color-border] px-3 py-2 text-sm"
                />
                {state?.fieldErrors?.name && (
                  <p className="mt-1 text-xs text-red-600">{state.fieldErrors.name}</p>
                )}
              </div>
              <div>
                <label htmlFor="create-description" className="mb-1 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="create-description"
                  name="description"
                  rows={2}
                  className="w-full rounded border border-[--color-border] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="create-type" className="mb-1 block text-sm font-medium">
                  Type *
                </label>
                <select
                  id="create-type"
                  name="type"
                  required
                  className="w-full rounded border border-[--color-border] px-3 py-2 text-sm"
                >
                  {AD_SLOT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {state?.fieldErrors?.type && (
                  <p className="mt-1 text-xs text-red-600">{state.fieldErrors.type}</p>
                )}
              </div>
              <div>
                <label htmlFor="create-position" className="mb-1 block text-sm font-medium">
                  Position
                </label>
                <input
                  id="create-position"
                  name="position"
                  className="w-full rounded border border-[--color-border] px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="create-width" className="mb-1 block text-sm font-medium">
                    Width
                  </label>
                  <input
                    id="create-width"
                    name="width"
                    type="number"
                    min={1}
                    className="w-full rounded border border-[--color-border] px-3 py-2 text-sm"
                  />
                  {state?.fieldErrors?.width && (
                    <p className="mt-1 text-xs text-red-600">{state.fieldErrors.width}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="create-height" className="mb-1 block text-sm font-medium">
                    Height
                  </label>
                  <input
                    id="create-height"
                    name="height"
                    type="number"
                    min={1}
                    className="w-full rounded border border-[--color-border] px-3 py-2 text-sm"
                  />
                  {state?.fieldErrors?.height && (
                    <p className="mt-1 text-xs text-red-600">{state.fieldErrors.height}</p>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="create-basePrice" className="mb-1 block text-sm font-medium">
                  Base price (USD/mo) *
                </label>
                <input
                  id="create-basePrice"
                  name="basePrice"
                  type="number"
                  step="0.01"
                  min={0.01}
                  required
                  className="w-full rounded border border-[--color-border] px-3 py-2 text-sm"
                />
                {state?.fieldErrors?.basePrice && (
                  <p className="mt-1 text-xs text-red-600">{state.fieldErrors.basePrice}</p>
                )}
              </div>
              <div>
                <label htmlFor="create-cpmFloor" className="mb-1 block text-sm font-medium">
                  CPM floor (optional)
                </label>
                <input
                  id="create-cpmFloor"
                  name="cpmFloor"
                  type="number"
                  step="0.01"
                  min={0}
                  className="w-full rounded border border-[--color-border] px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} className="rounded border px-4 py-2 text-sm">
                  Cancel
                </button>
                <SubmitButton
                  className="rounded bg-[--color-primary] px-4 py-2 text-sm font-medium text-white hover:bg-[--color-primary-hover]"
                >
                  Create
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
