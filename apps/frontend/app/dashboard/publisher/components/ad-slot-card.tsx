'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormState } from 'react-dom';
import { toast } from 'sonner';
import { updateAdSlotAction, deleteAdSlotAction, type PublisherFormState } from '../actions';
import { SubmitButton } from './submit-button';

interface AdSlotCardProps {
  adSlot: {
    id: string;
    name: string;
    description?: string | null;
    type: string;
    position?: string | null;
    width?: number | null;
    height?: number | null;
    basePrice: number;
    cpmFloor?: number | null;
    isAvailable: boolean;
  };
}

const AD_SLOT_TYPES = ['DISPLAY', 'VIDEO', 'NATIVE', 'NEWSLETTER', 'PODCAST'];
const typeColors: Record<string, string> = {
  DISPLAY: 'bg-blue-100 text-blue-700',
  VIDEO: 'bg-red-100 text-red-700',
  NATIVE: 'bg-teal-100 text-teal-700',
  NEWSLETTER: 'bg-purple-100 text-purple-700',
  PODCAST: 'bg-orange-100 text-orange-700',
};

const emptyFormState: PublisherFormState = {};

export function AdSlotCard({ adSlot }: AdSlotCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [updateState, updateFormAction] = useFormState(updateAdSlotAction, emptyFormState);
  const [deleteState, deleteFormAction] = useFormState(deleteAdSlotAction, emptyFormState);

  const closeEdit = () => setEditOpen(false);
  const closeDeleteConfirm = () => setDeleteConfirm(false);
  const prevUpdateStateRef = useRef(updateState);
  const prevDeleteStateRef = useRef(deleteState);

  // Close modal only when state object reference changes AND it's a success
  useEffect(() => {
    if (updateState?.success && updateState !== prevUpdateStateRef.current && editOpen) {
      toast.success('Ad slot updated successfully');
      queueMicrotask(closeEdit);
    }
    if (updateState?.error && updateState !== prevUpdateStateRef.current) {
      toast.error(updateState.error);
    }
    prevUpdateStateRef.current = updateState;
  }, [updateState, editOpen]);

  useEffect(() => {
    if (deleteState?.success && deleteState !== prevDeleteStateRef.current) {
      toast.success('Ad slot deleted successfully');
      if (deleteConfirm) queueMicrotask(closeDeleteConfirm);
    }
    if (deleteState?.error && deleteState !== prevDeleteStateRef.current) {
      toast.error(deleteState.error);
    }
    prevDeleteStateRef.current = deleteState;
  }, [deleteState, deleteConfirm]);

  return (
    <div className="rounded-lg border border-[--color-border] p-4">
      <div className="mb-2 flex items-start justify-between">
        <h3 className="font-semibold">{adSlot.name}</h3>
        <span className={`rounded px-2 py-0.5 text-xs ${typeColors[adSlot.type] || 'bg-gray-100'}`}>
          {adSlot.type}
        </span>
      </div>

      {adSlot.description && (
        <p className="mb-3 text-sm text-[--color-muted] line-clamp-2">{adSlot.description}</p>
      )}

      <div className="flex items-center justify-between">
        <span
          className={`text-sm ${adSlot.isAvailable ? 'text-green-600' : 'text-[--color-muted]'}`}
        >
          {adSlot.isAvailable ? 'Available' : 'Booked'}
        </span>
        <span className="font-semibold text-[--color-primary]">
          ${Number(adSlot.basePrice).toLocaleString()}/mo
        </span>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="rounded border border-[--color-border] px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Edit
        </button>
        {!deleteConfirm ? (
          <button
            type="button"
            onClick={() => setDeleteConfirm(true)}
            className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <form
              action={deleteFormAction}
              className="inline"
              onSubmit={() => toast.success('Ad slot deleted successfully')}
            >
              <input type="hidden" name="id" value={adSlot.id} />
              <SubmitButton
                pendingLabel="Deleting..."
                className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
              >
                Yes, delete
              </SubmitButton>
            </form>
            <button
              type="button"
              onClick={closeDeleteConfirm}
              className="rounded border px-3 py-1.5 text-sm"
            >
              Cancel
            </button>
            {deleteState?.error && (
              <span className="text-xs text-red-600">{deleteState.error}</span>
            )}
          </div>
        )}
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" aria-modal="true">
          <div className="relative w-full max-w-lg rounded-lg border border-cyan-400/50 bg-[--color-background] p-6 shadow-[0_0_30px_rgba(34,211,238,0.25)] ring-1 ring-cyan-400/30">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Edit Ad Slot</h2>
              <button
                type="button"
                onClick={closeEdit}
                aria-label="Close"
                className="rounded p-1 text-[--color-muted] transition-colors hover:bg-[--color-border] hover:text-[--color-foreground]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <form action={updateFormAction} className="space-y-5">
              <input type="hidden" name="id" value={adSlot.id} />
              {updateState?.error && (
                <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {updateState.error}
                </div>
              )}
              <div>
                <label htmlFor={`edit-name-${adSlot.id}`} className="mb-2 block text-sm font-medium">
                  Name *
                </label>
                <input
                  id={`edit-name-${adSlot.id}`}
                  name="name"
                  defaultValue={adSlot.name}
                  required
                  className="w-full rounded-lg border border-[--color-border] px-3 py-2.5 text-sm"
                />
                {updateState?.fieldErrors?.name && (
                  <p className="mt-1.5 text-xs text-red-600">{updateState.fieldErrors.name}</p>
                )}
              </div>
              <div>
                <label htmlFor={`edit-description-${adSlot.id}`} className="mb-2 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  id={`edit-description-${adSlot.id}`}
                  name="description"
                  defaultValue={adSlot.description ?? ''}
                  rows={2}
                  className="w-full rounded-lg border border-[--color-border] px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor={`edit-type-${adSlot.id}`} className="mb-2 block text-sm font-medium">
                  Type *
                </label>
                <select
                  id={`edit-type-${adSlot.id}`}
                  name="type"
                  defaultValue={adSlot.type}
                  required
                  className="w-full rounded-lg border border-[--color-border] px-3 py-2.5 text-sm"
                >
                  {AD_SLOT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {updateState?.fieldErrors?.type && (
                  <p className="mt-1.5 text-xs text-red-600">{updateState.fieldErrors.type}</p>
                )}
              </div>
              <div>
                <label htmlFor={`edit-position-${adSlot.id}`} className="mb-2 block text-sm font-medium">
                  Position
                </label>
                <input
                  id={`edit-position-${adSlot.id}`}
                  name="position"
                  defaultValue={adSlot.position ?? ''}
                  className="w-full rounded-lg border border-[--color-border] px-3 py-2.5 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`edit-width-${adSlot.id}`} className="mb-2 block text-sm font-medium">
                    Width
                  </label>
                  <div className="relative">
                    <input
                      id={`edit-width-${adSlot.id}`}
                      name="width"
                      type="number"
                      min={1}
                      defaultValue={adSlot.width ?? ''}
                      className="w-full rounded-lg border border-[--color-border] px-3 py-2.5 pr-10 text-sm"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[--color-muted]">px</span>
                  </div>
                  {updateState?.fieldErrors?.width && (
                    <p className="mt-1.5 text-xs text-red-600">{updateState.fieldErrors.width}</p>
                  )}
                </div>
                <div>
                  <label htmlFor={`edit-height-${adSlot.id}`} className="mb-2 block text-sm font-medium">
                    Height
                  </label>
                  <div className="relative">
                    <input
                      id={`edit-height-${adSlot.id}`}
                      name="height"
                      type="number"
                      min={1}
                      defaultValue={adSlot.height ?? ''}
                      className="w-full rounded-lg border border-[--color-border] px-3 py-2.5 pr-10 text-sm"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[--color-muted]">px</span>
                  </div>
                  {updateState?.fieldErrors?.height && (
                    <p className="mt-1.5 text-xs text-red-600">{updateState.fieldErrors.height}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`edit-basePrice-${adSlot.id}`} className="mb-2 block text-sm font-medium">
                    Base price (USD/mo) *
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[--color-muted]">$</span>
                    <input
                      id={`edit-basePrice-${adSlot.id}`}
                      name="basePrice"
                      type="number"
                      step="0.01"
                      min={0.01}
                      defaultValue={adSlot.basePrice}
                      required
                      className="w-full rounded-lg border border-[--color-border] pl-7 pr-3 py-2.5 text-sm"
                    />
                  </div>
                  {updateState?.fieldErrors?.basePrice && (
                    <p className="mt-1.5 text-xs text-red-600">{updateState.fieldErrors.basePrice}</p>
                  )}
                </div>
                <div>
                  <label htmlFor={`edit-cpmFloor-${adSlot.id}`} className="mb-2 block text-sm font-medium">
                    CPM floor (optional)
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[--color-muted]">$</span>
                    <input
                      id={`edit-cpmFloor-${adSlot.id}`}
                      name="cpmFloor"
                      type="number"
                      step="0.01"
                      min={0}
                      defaultValue={adSlot.cpmFloor ?? ''}
                      className="w-full rounded-lg border border-[--color-border] pl-7 pr-3 py-2.5 text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeEdit} className="rounded-lg border border-[--color-border] px-4 py-2.5 text-sm transition-colors hover:bg-[--color-border]/50">
                  Cancel
                </button>
                <SubmitButton
                  className="rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-cyan-600"
                >
                  Save
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
