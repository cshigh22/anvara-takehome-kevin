'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createCampaign, updateCampaign, deleteCampaign } from '@/lib/api';

const CAMPAIGN_STATUSES = [
  'DRAFT',
  'PENDING_REVIEW',
  'APPROVED',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'CANCELLED',
] as const;

export type SponsorFormState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function getCookie(): Promise<string> {
  return headers().then((h) => h.get('cookie') ?? '');
}

export async function createCampaignAction(
  prevState: SponsorFormState,
  formData: FormData
): Promise<SponsorFormState> {
  const fieldErrors: Record<string, string> = {};
  const name = formData.get('name')?.toString()?.trim();
  const budgetStr = formData.get('budget')?.toString();
  const startDateStr = formData.get('startDate')?.toString();
  const endDateStr = formData.get('endDate')?.toString();
  const status = formData.get('status')?.toString();

  if (!name) fieldErrors.name = 'Name is required';
  if (!budgetStr) fieldErrors.budget = 'Budget is required';
  else {
    const b = Number(budgetStr);
    if (Number.isNaN(b) || b <= 0) fieldErrors.budget = 'Budget must be a positive number';
  }
  if (!startDateStr) fieldErrors.startDate = 'Start date is required';
  if (!endDateStr) fieldErrors.endDate = 'End date is required';
  if (startDateStr && endDateStr) {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (end < start) fieldErrors.endDate = 'End date must be on or after start date';
  }
  if (status !== undefined && status !== '' && !CAMPAIGN_STATUSES.includes(status as (typeof CAMPAIGN_STATUSES)[number])) {
    fieldErrors.status = `Status must be one of: ${CAMPAIGN_STATUSES.join(', ')}`;
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  try {
    const cookie = await getCookie();
    const targetCategoriesStr = formData.get('targetCategories')?.toString();
    const targetRegionsStr = formData.get('targetRegions')?.toString();
    await createCampaign(
      {
        name: name!,
        description: formData.get('description')?.toString() || undefined,
        budget: Number(budgetStr!),
        startDate: startDateStr!,
        endDate: endDateStr!,
        cpmRate: formData.get('cpmRate')?.toString() ? Number(formData.get('cpmRate')) : undefined,
        cpcRate: formData.get('cpcRate')?.toString() ? Number(formData.get('cpcRate')) : undefined,
        targetCategories: targetCategoriesStr ? targetCategoriesStr.split(',').map((s) => s.trim()).filter(Boolean) : [],
        targetRegions: targetRegionsStr ? targetRegionsStr.split(',').map((s) => s.trim()).filter(Boolean) : [],
      },
      { cookie }
    );
    revalidatePath('/dashboard/sponsor');
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to create campaign' };
  }
}

export async function updateCampaignAction(
  prevState: SponsorFormState,
  formData: FormData
): Promise<SponsorFormState> {
  const id = formData.get('id')?.toString();
  if (!id) return { error: 'Missing campaign id' };

  const fieldErrors: Record<string, string> = {};
  const budgetStr = formData.get('budget')?.toString();
  const spentStr = formData.get('spent')?.toString();
  const startDateStr = formData.get('startDate')?.toString();
  const endDateStr = formData.get('endDate')?.toString();
  const status = formData.get('status')?.toString();

  if (budgetStr !== undefined && budgetStr !== '') {
    const b = Number(budgetStr);
    if (Number.isNaN(b) || b <= 0) fieldErrors.budget = 'Budget must be a positive number';
  }
  if (spentStr !== undefined && spentStr !== '') {
    const s = Number(spentStr);
    if (Number.isNaN(s) || s < 0) fieldErrors.spent = 'Spent must be a non-negative number';
  }
  if (startDateStr && endDateStr) {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (end < start) fieldErrors.endDate = 'End date must be on or after start date';
  }
  if (status !== undefined && status !== '' && !CAMPAIGN_STATUSES.includes(status as (typeof CAMPAIGN_STATUSES)[number])) {
    fieldErrors.status = `Status must be one of: ${CAMPAIGN_STATUSES.join(', ')}`;
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const data: Record<string, unknown> = {};
  const name = formData.get('name')?.toString()?.trim();
  if (name !== undefined) data.name = name;
  const description = formData.get('description')?.toString();
  if (description !== undefined) data.description = description || null;
  if (budgetStr !== undefined && budgetStr !== '') data.budget = Number(budgetStr);
  if (spentStr !== undefined && spentStr !== '') data.spent = Number(spentStr);
  const cpmRateStr = formData.get('cpmRate')?.toString();
  if (cpmRateStr !== undefined) data.cpmRate = cpmRateStr === '' ? null : Number(cpmRateStr);
  const cpcRateStr = formData.get('cpcRate')?.toString();
  if (cpcRateStr !== undefined) data.cpcRate = cpcRateStr === '' ? null : Number(cpcRateStr);
  if (startDateStr) data.startDate = startDateStr;
  if (endDateStr) data.endDate = endDateStr;
  const targetCategoriesStr = formData.get('targetCategories')?.toString();
  if (targetCategoriesStr !== undefined) {
    data.targetCategories = targetCategoriesStr ? targetCategoriesStr.split(',').map((s) => s.trim()).filter(Boolean) : [];
  }
  const targetRegionsStr = formData.get('targetRegions')?.toString();
  if (targetRegionsStr !== undefined) {
    data.targetRegions = targetRegionsStr ? targetRegionsStr.split(',').map((s) => s.trim()).filter(Boolean) : [];
  }
  if (status !== undefined) data.status = status;

  if (Object.keys(data).length === 0) return { error: 'No fields to update' };

  try {
    const cookie = await getCookie();
    await updateCampaign(id, data, { cookie });
    revalidatePath('/dashboard/sponsor');
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to update campaign' };
  }
}

export async function deleteCampaignAction(
  prevState: SponsorFormState,
  formData: FormData
): Promise<SponsorFormState> {
  const id = formData.get('id')?.toString();
  if (!id) return { error: 'Missing campaign id' };

  try {
    const cookie = await getCookie();
    await deleteCampaign(id, { cookie });
    revalidatePath('/dashboard/sponsor');
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to delete campaign' };
  }
}
