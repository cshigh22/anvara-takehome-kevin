'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useFormState } from 'react-dom';
import { toast } from 'sonner';
import { createCampaignAction, type SponsorFormState } from '../actions';
import { SubmitButton } from './submit-button';

const initialState: SponsorFormState = {};

export function CreateCampaignButton() {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [state, formAction] = useFormState(createCampaignAction, initialState);

  const closeModal = useCallback(() => {
    setOpen(false);
  }, []);

  const prevStateRef = useRef(state);
  useEffect(() => {
    if (state?.success && state !== prevStateRef.current && open) {
      toast.success('Campaign created successfully');
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
        Create Campaign
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-[--color-background] p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">Create Campaign</h2>
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
                <label htmlFor="create-budget" className="mb-1 block text-sm font-medium">
                  Budget *
                </label>
                <input
                  id="create-budget"
                  name="budget"
                  type="number"
                  step="0.01"
                  min={0.01}
                  required
                  className="w-full rounded border border-[--color-border] px-3 py-2 text-sm"
                />
                {state?.fieldErrors?.budget && (
                  <p className="mt-1 text-xs text-red-600">{state.fieldErrors.budget}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="create-startDate" className="mb-1 block text-sm font-medium">
                    Start date *
                  </label>
                  <input
                    id="create-startDate"
                    name="startDate"
                    type="date"
                    required
                    className="w-full rounded border border-[--color-border] px-3 py-2 text-sm"
                  />
                  {state?.fieldErrors?.startDate && (
                    <p className="mt-1 text-xs text-red-600">{state.fieldErrors.startDate}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="create-endDate" className="mb-1 block text-sm font-medium">
                    End date *
                  </label>
                  <input
                    id="create-endDate"
                    name="endDate"
                    type="date"
                    required
                    className="w-full rounded border border-[--color-border] px-3 py-2 text-sm"
                  />
                  {state?.fieldErrors?.endDate && (
                    <p className="mt-1 text-xs text-red-600">{state.fieldErrors.endDate}</p>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="create-cpmRate" className="mb-1 block text-sm font-medium">
                  CPM rate (optional)
                </label>
                <input
                  id="create-cpmRate"
                  name="cpmRate"
                  type="number"
                  step="0.01"
                  min={0}
                  className="w-full rounded border border-[--color-border] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="create-cpcRate" className="mb-1 block text-sm font-medium">
                  CPC rate (optional)
                </label>
                <input
                  id="create-cpcRate"
                  name="cpcRate"
                  type="number"
                  step="0.01"
                  min={0}
                  className="w-full rounded border border-[--color-border] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="create-targetCategories" className="mb-1 block text-sm font-medium">
                  Target categories (comma-separated)
                </label>
                <input
                  id="create-targetCategories"
                  name="targetCategories"
                  className="w-full rounded border border-[--color-border] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="create-targetRegions" className="mb-1 block text-sm font-medium">
                  Target regions (comma-separated)
                </label>
                <input
                  id="create-targetRegions"
                  name="targetRegions"
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
