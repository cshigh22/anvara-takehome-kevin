'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormState } from 'react-dom';
import { toast } from 'sonner';
import { updateCampaignAction, deleteCampaignAction, type SponsorFormState } from '../actions';
import { SubmitButton } from './submit-button';

interface CampaignCardProps {
  campaign: {
    id: string;
    name: string;
    description?: string | null;
    budget: number;
    spent: number;
    status: string;
    startDate: string;
    endDate: string;
    cpmRate?: number | null;
    cpcRate?: number | null;
    targetCategories?: string[];
    targetRegions?: string[];
  };
}

const CAMPAIGN_STATUSES = ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'];
const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-green-100 text-green-700',
  PAUSED: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  PENDING_REVIEW: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const emptyFormState: SponsorFormState = {};

function formatDateForInput(dateStr: string) {
  const d = new Date(dateStr);
  return d.toISOString().slice(0, 10);
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [updateState, updateFormAction] = useFormState(updateCampaignAction, emptyFormState);
  const [deleteState, deleteFormAction] = useFormState(deleteCampaignAction, emptyFormState);

  const progress =
    campaign.budget > 0 ? (Number(campaign.spent) / Number(campaign.budget)) * 100 : 0;

  const closeEdit = () => setEditOpen(false);
  const closeDeleteConfirm = () => setDeleteConfirm(false);
  const prevUpdateStateRef = useRef(updateState);
  const prevDeleteStateRef = useRef(deleteState);

  // Close modal only when state object reference changes AND it's a success
  useEffect(() => {
    if (updateState?.success && updateState !== prevUpdateStateRef.current && editOpen) {
      toast.success('Campaign updated successfully');
      queueMicrotask(closeEdit);
    }
    if (updateState?.error && updateState !== prevUpdateStateRef.current) {
      toast.error(updateState.error);
    }
    prevUpdateStateRef.current = updateState;
  }, [updateState, editOpen]);

  useEffect(() => {
    if (deleteState?.success && deleteState !== prevDeleteStateRef.current) {
      toast.success('Campaign deleted successfully');
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
        <h3 className="font-semibold">{campaign.name}</h3>
        <span
          className={`rounded px-2 py-0.5 text-xs ${statusColors[campaign.status] || 'bg-gray-100'}`}
        >
          {campaign.status}
        </span>
      </div>

      {campaign.description && (
        <p className="mb-3 text-sm text-[--color-muted] line-clamp-2">{campaign.description}</p>
      )}

      <div className="mb-2">
        <div className="flex justify-between text-sm">
          <span className="text-[--color-muted]">Budget</span>
          <span>
            ${Number(campaign.spent).toLocaleString()} / ${Number(campaign.budget).toLocaleString()}
          </span>
        </div>
        <div className="mt-1 h-1.5 rounded-full bg-gray-200">
          <div
            className="h-1.5 rounded-full bg-[--color-primary]"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      <div className="mb-3 text-xs text-[--color-muted]">
        {new Date(campaign.startDate).toLocaleDateString()} -{' '}
        {new Date(campaign.endDate).toLocaleDateString()}
      </div>

      <div className="flex gap-2">
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
          <div className="flex flex-wrap items-center gap-2">
            <form
              action={deleteFormAction}
              className="inline"
              onSubmit={() => toast.success('Campaign deleted successfully')}
            >
              <input type="hidden" name="id" value={campaign.id} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-[--color-background] p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">Edit Campaign</h2>
            <form action={updateFormAction} className="space-y-4">
              <input type="hidden" name="id" value={campaign.id} />
              {updateState?.error && (
                <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">
                  {updateState.error}
                </div>
              )}
              <div>
                <label htmlFor={`edit-name-${campaign.id}`} className="mb-1 block text-sm font-medium">
                  Name *
                </label>
                <input
                  id={`edit-name-${campaign.id}`}
                  name="name"
                  defaultValue={campaign.name}
                  required
                  className="w-full rounded border border-[--color-border] px-3 py-2 text-sm"
                />
                {updateState?.fieldErrors?.name && (
                  <p className="mt-1 text-xs text-red-600">{updateState.fieldErrors.name}</p>
                )}
              </div>
              <div>
                <label htmlFor={`edit-description-${campaign.id}`} className="mb-1 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  id={`edit-description-${campaign.id}`}
                  name="description"
                  defaultValue={campaign.description ?? ''}
                  rows={2}
                  className="w-full rounded border border-[--color-border] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor={`edit-budget-${campaign.id}`} className="mb-1 block text-sm font-medium">
                  Budget *
                </label>
                <input
                  id={`edit-budget-${campaign.id}`}
                  name="budget"
                  type="number"
                  step="0.01"
                  min={0.01}
                  defaultValue={campaign.budget}
                  required
                  className="w-full rounded border border-[--color-border] px-3 py-2 text-sm"
                />
                {updateState?.fieldErrors?.budget && (
                  <p className="mt-1 text-xs text-red-600">{updateState.fieldErrors.budget}</p>
                )}
              </div>
              <div>
                <label htmlFor={`edit-spent-${campaign.id}`} className="mb-1 block text-sm font-medium">
                  Spent
                </label>
                <input
                  id={`edit-spent-${campaign.id}`}
                  name="spent"
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={campaign.spent}
                  className="w-full rounded border border-[--color-border] px-3 py-2 text-sm"
                />
                {updateState?.fieldErrors?.spent && (
                  <p className="mt-1 text-xs text-red-600">{updateState.fieldErrors.spent}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`edit-startDate-${campaign.id}`} className="mb-1 block text-sm font-medium">
                    Start date
                  </label>
                  <input
                    id={`edit-startDate-${campaign.id}`}
                    name="startDate"
                    type="date"
                    defaultValue={formatDateForInput(campaign.startDate)}
                    className="w-full rounded border border-[--color-border] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor={`edit-endDate-${campaign.id}`} className="mb-1 block text-sm font-medium">
                    End date
                  </label>
                  <input
                    id={`edit-endDate-${campaign.id}`}
                    name="endDate"
                    type="date"
                    defaultValue={formatDateForInput(campaign.endDate)}
                    className="w-full rounded border border-[--color-border] px-3 py-2 text-sm"
                  />
                  {updateState?.fieldErrors?.endDate && (
                    <p className="mt-1 text-xs text-red-600">{updateState.fieldErrors.endDate}</p>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor={`edit-status-${campaign.id}`} className="mb-1 block text-sm font-medium">
                  Status
                </label>
                <select
                  id={`edit-status-${campaign.id}`}
                  name="status"
                  defaultValue={campaign.status}
                  className="w-full rounded border border-[--color-border] px-3 py-2 text-sm"
                >
                  {CAMPAIGN_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {updateState?.fieldErrors?.status && (
                  <p className="mt-1 text-xs text-red-600">{updateState.fieldErrors.status}</p>
                )}
              </div>
              <div>
                <label htmlFor={`edit-cpmRate-${campaign.id}`} className="mb-1 block text-sm font-medium">
                  CPM rate
                </label>
                <input
                  id={`edit-cpmRate-${campaign.id}`}
                  name="cpmRate"
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={campaign.cpmRate ?? ''}
                  className="w-full rounded border border-[--color-border] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor={`edit-cpcRate-${campaign.id}`} className="mb-1 block text-sm font-medium">
                  CPC rate
                </label>
                <input
                  id={`edit-cpcRate-${campaign.id}`}
                  name="cpcRate"
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={campaign.cpcRate ?? ''}
                  className="w-full rounded border border-[--color-border] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor={`edit-targetCategories-${campaign.id}`} className="mb-1 block text-sm font-medium">
                  Target categories (comma-separated)
                </label>
                <input
                  id={`edit-targetCategories-${campaign.id}`}
                  name="targetCategories"
                  defaultValue={Array.isArray(campaign.targetCategories) ? campaign.targetCategories.join(', ') : ''}
                  className="w-full rounded border border-[--color-border] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor={`edit-targetRegions-${campaign.id}`} className="mb-1 block text-sm font-medium">
                  Target regions (comma-separated)
                </label>
                <input
                  id={`edit-targetRegions-${campaign.id}`}
                  name="targetRegions"
                  defaultValue={Array.isArray(campaign.targetRegions) ? campaign.targetRegions.join(', ') : ''}
                  className="w-full rounded border border-[--color-border] px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeEdit} className="rounded border px-4 py-2 text-sm">
                  Cancel
                </button>
                <SubmitButton
                  className="rounded bg-[--color-primary] px-4 py-2 text-sm font-medium text-white hover:bg-[--color-primary-hover]"
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
