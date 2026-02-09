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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" aria-modal="true">
          <div className="relative w-full max-w-lg rounded-lg border border-cyan-400/50 bg-[--color-background] p-6 shadow-[0_0_30px_rgba(34,211,238,0.25)] ring-1 ring-cyan-400/30">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Create Ad Slot</h2>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                className="rounded p-1 text-[--color-muted] hover:bg-[--color-border] hover:text-[--color-foreground] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <form key={formKey} action={formAction} className="space-y-5">
              {state?.error && (
                <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {state.error}
                </div>
              )}
              <div>
                <label htmlFor="create-name" className="mb-2 block text-sm font-medium">
                  Name *
                </label>
                <input
                  id="create-name"
                  name="name"
                  required
                  className="w-full rounded-lg border border-[--color-border] px-3 py-2.5 text-sm"
                />
                {state?.fieldErrors?.name && (
                  <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.name}</p>
                )}
              </div>
              <div>
                <label htmlFor="create-description" className="mb-2 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="create-description"
                  name="description"
                  rows={2}
                  className="w-full rounded-lg border border-[--color-border] px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="create-type" className="mb-2 block text-sm font-medium">
                  Type *
                </label>
                <select
                  id="create-type"
                  name="type"
                  required
                  className="w-full rounded-lg border border-[--color-border] px-3 py-2.5 text-sm"
                >
                  {AD_SLOT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {state?.fieldErrors?.type && (
                  <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.type}</p>
                )}
              </div>
              <div>
                <label htmlFor="create-position" className="mb-2 block text-sm font-medium">
                  Position
                </label>
                <input
                  id="create-position"
                  name="position"
                  className="w-full rounded-lg border border-[--color-border] px-3 py-2.5 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="create-width" className="mb-2 block text-sm font-medium">
                    Width
                  </label>
                  <div className="relative">
                    <input
                      id="create-width"
                      name="width"
                      type="number"
                      min={1}
                      placeholder="0"
                      className="w-full rounded-lg border border-[--color-border] px-3 py-2.5 pr-10 text-sm"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[--color-muted]">px</span>
                  </div>
                  {state?.fieldErrors?.width && (
                    <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.width}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="create-height" className="mb-2 block text-sm font-medium">
                    Height
                  </label>
                  <div className="relative">
                    <input
                      id="create-height"
                      name="height"
                      type="number"
                      min={1}
                      placeholder="0"
                      className="w-full rounded-lg border border-[--color-border] px-3 py-2.5 pr-10 text-sm"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[--color-muted]">px</span>
                  </div>
                  {state?.fieldErrors?.height && (
                    <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.height}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="create-basePrice" className="mb-2 block text-sm font-medium">
                    Base price (USD/mo) *
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[--color-muted]">$</span>
                    <input
                      id="create-basePrice"
                      name="basePrice"
                      type="number"
                      step="0.01"
                      min={0.01}
                      required
                      placeholder="0.00"
                      className="w-full rounded-lg border border-[--color-border] pl-7 pr-3 py-2.5 text-sm"
                    />
                  </div>
                  {state?.fieldErrors?.basePrice && (
                    <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.basePrice}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="create-cpmFloor" className="mb-2 block text-sm font-medium">
                    CPM floor (optional)
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[--color-muted]">$</span>
                    <input
                      id="create-cpmFloor"
                      name="cpmFloor"
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-[--color-border] pl-7 pr-3 py-2.5 text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeModal} className="rounded-lg border border-[--color-border] px-4 py-2.5 text-sm transition-colors hover:bg-[--color-border]/50">
                  Cancel
                </button>
                <SubmitButton
                  className="rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-cyan-600"
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
