'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useActionState } from 'react';
import { toast } from 'sonner';
import { createCampaignAction, type SponsorFormState } from '../actions';
import { SubmitButton } from './submit-button';

const initialState: SponsorFormState = {};

export function CreateCampaignButton() {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [state, formAction] = useActionState(createCampaignAction, initialState);

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" aria-modal="true">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-cyan-400/50 bg-[--color-background] p-6 shadow-[0_0_30px_rgba(34,211,238,0.25)] ring-1 ring-cyan-400/30">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Create Campaign</h2>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                className="rounded p-1 text-[--color-muted] transition-colors hover:bg-[--color-border] hover:text-[--color-foreground]"
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
                <label htmlFor="create-budget" className="mb-2 block text-sm font-medium">
                  Budget *
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[--color-muted]">$</span>
                  <input
                    id="create-budget"
                    name="budget"
                    type="number"
                    step="0.01"
                    min={0.01}
                    required
                    placeholder="0.00"
                    className="w-full rounded-lg border border-[--color-border] pl-7 pr-3 py-2.5 text-sm"
                  />
                </div>
                {state?.fieldErrors?.budget && (
                  <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.budget}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="create-startDate" className="mb-2 block text-sm font-medium">
                    Start date *
                  </label>
                  <input
                    id="create-startDate"
                    name="startDate"
                    type="date"
                    required
                    className="w-full rounded-lg border border-[--color-border] px-3 py-2.5 text-sm"
                  />
                  {state?.fieldErrors?.startDate && (
                    <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.startDate}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="create-endDate" className="mb-2 block text-sm font-medium">
                    End date *
                  </label>
                  <input
                    id="create-endDate"
                    name="endDate"
                    type="date"
                    required
                    className="w-full rounded-lg border border-[--color-border] px-3 py-2.5 text-sm"
                  />
                  {state?.fieldErrors?.endDate && (
                    <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.endDate}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="create-cpmRate" className="mb-2 block text-sm font-medium">
                    CPM rate (optional)
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[--color-muted]">$</span>
                    <input
                      id="create-cpmRate"
                      name="cpmRate"
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-[--color-border] pl-7 pr-3 py-2.5 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="create-cpcRate" className="mb-2 block text-sm font-medium">
                    CPC rate (optional)
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[--color-muted]">$</span>
                    <input
                      id="create-cpcRate"
                      name="cpcRate"
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-[--color-border] pl-7 pr-3 py-2.5 text-sm"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="create-targetCategories" className="mb-2 block text-sm font-medium">
                  Target categories (comma-separated)
                </label>
                <input
                  id="create-targetCategories"
                  name="targetCategories"
                  className="w-full rounded-lg border border-[--color-border] px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="create-targetRegions" className="mb-2 block text-sm font-medium">
                  Target regions (comma-separated)
                </label>
                <input
                  id="create-targetRegions"
                  name="targetRegions"
                  className="w-full rounded-lg border border-[--color-border] px-3 py-2.5 text-sm"
                />
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
