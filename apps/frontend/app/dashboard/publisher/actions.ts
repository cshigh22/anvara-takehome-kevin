'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createAdSlot, updateAdSlot, deleteAdSlot } from '@/lib/api';

const AD_SLOT_TYPES = ['DISPLAY', 'VIDEO', 'NATIVE', 'NEWSLETTER', 'PODCAST'] as const;

export type PublisherFormState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function getCookie(): Promise<string> {
  return headers().then((h) => h.get('cookie') ?? '');
}

function validateAdSlotFormData(formData: FormData, isUpdate: boolean): Record<string, string> | null {
  const fieldErrors: Record<string, string> = {};
  const name = formData.get('name')?.toString()?.trim();
  const type = formData.get('type')?.toString();
  const basePriceStr = formData.get('basePrice')?.toString();
  const widthStr = formData.get('width')?.toString();
  const heightStr = formData.get('height')?.toString();

  if (!isUpdate) {
    if (!name) fieldErrors.name = 'Name is required';
    if (!type) fieldErrors.type = 'Type is required';
    else if (!AD_SLOT_TYPES.includes(type as (typeof AD_SLOT_TYPES)[number])) {
      fieldErrors.type = `Type must be one of: ${AD_SLOT_TYPES.join(', ')}`;
    }
    if (basePriceStr === undefined || basePriceStr === '') {
      fieldErrors.basePrice = 'Base price is required';
    } else {
      const n = Number(basePriceStr);
      if (Number.isNaN(n) || n <= 0) fieldErrors.basePrice = 'Base price must be a positive number';
    }
  } else {
    if (type !== undefined && type !== null && type !== '' && !AD_SLOT_TYPES.includes(type as (typeof AD_SLOT_TYPES)[number])) {
      fieldErrors.type = `Type must be one of: ${AD_SLOT_TYPES.join(', ')}`;
    }
    if (basePriceStr !== undefined && basePriceStr !== '') {
      const n = Number(basePriceStr);
      if (Number.isNaN(n) || n <= 0) fieldErrors.basePrice = 'Base price must be a positive number';
    }
  }

  if (widthStr !== undefined && widthStr !== '') {
    const w = Number(widthStr);
    if (Number.isNaN(w) || w < 1 || Math.floor(w) !== w) {
      fieldErrors.width = 'Width must be a positive integer';
    }
  }
  if (heightStr !== undefined && heightStr !== '') {
    const h = Number(heightStr);
    if (Number.isNaN(h) || h < 1 || Math.floor(h) !== h) {
      fieldErrors.height = 'Height must be a positive integer';
    }
  }

  if (Object.keys(fieldErrors).length > 0) return fieldErrors;
  return null;
}

export async function createAdSlotAction(
  prevState: PublisherFormState,
  formData: FormData
): Promise<PublisherFormState> {
  const fieldErrors = validateAdSlotFormData(formData, false);
  if (fieldErrors) return { fieldErrors };

  const name = formData.get('name')?.toString()?.trim();
  const type = formData.get('type')?.toString();
  const basePriceStr = formData.get('basePrice')?.toString();
  if (!name || !type || basePriceStr === undefined) {
    return { fieldErrors: { name: 'Name is required', type: 'Type is required', basePrice: 'Base price is required' } };
  }
  const basePrice = Number(basePriceStr);
  if (Number.isNaN(basePrice) || basePrice <= 0) {
    return { fieldErrors: { basePrice: 'Base price must be a positive number' } };
  }
  if (!AD_SLOT_TYPES.includes(type as (typeof AD_SLOT_TYPES)[number])) {
    return { fieldErrors: { type: `Type must be one of: ${AD_SLOT_TYPES.join(', ')}` } };
  }

  try {
    const cookie = await getCookie();
    await createAdSlot(
      {
        name,
        description: formData.get('description')?.toString() || undefined,
        type: type as (typeof AD_SLOT_TYPES)[number],
        position: formData.get('position')?.toString() || undefined,
        width: formData.get('width')?.toString() ? Number(formData.get('width')) : undefined,
        height: formData.get('height')?.toString() ? Number(formData.get('height')) : undefined,
        basePrice,
        cpmFloor: formData.get('cpmFloor')?.toString() ? Number(formData.get('cpmFloor')) : undefined,
      },
      { cookie }
    );
    revalidatePath('/dashboard/publisher');
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to create ad slot' };
  }
}

export async function updateAdSlotAction(
  prevState: PublisherFormState,
  formData: FormData
): Promise<PublisherFormState> {
  const id = formData.get('id')?.toString();
  if (!id) return { error: 'Missing ad slot id' };

  const fieldErrors = validateAdSlotFormData(formData, true);
  if (fieldErrors) return { fieldErrors };

  const data: Record<string, unknown> = {};
  const name = formData.get('name')?.toString()?.trim();
  if (name !== undefined) data.name = name;
  const description = formData.get('description')?.toString();
  if (description !== undefined) data.description = description || null;
  const type = formData.get('type')?.toString();
  if (type !== undefined) data.type = type;
  const position = formData.get('position')?.toString();
  if (position !== undefined) data.position = position || null;
  const widthStr = formData.get('width')?.toString();
  if (widthStr !== undefined && widthStr !== '') data.width = Number(widthStr);
  const heightStr = formData.get('height')?.toString();
  if (heightStr !== undefined && heightStr !== '') data.height = Number(heightStr);
  const basePriceStr = formData.get('basePrice')?.toString();
  if (basePriceStr !== undefined && basePriceStr !== '') data.basePrice = Number(basePriceStr);
  const cpmFloorStr = formData.get('cpmFloor')?.toString();
  if (cpmFloorStr !== undefined) data.cpmFloor = cpmFloorStr === '' ? null : Number(cpmFloorStr);
  const isAvailable = formData.get('isAvailable')?.toString();
  if (isAvailable !== undefined) data.isAvailable = isAvailable === 'true';

  if (Object.keys(data).length === 0) return { error: 'No fields to update' };

  try {
    const cookie = await getCookie();
    await updateAdSlot(id, data, { cookie });
    revalidatePath('/dashboard/publisher');
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to update ad slot' };
  }
}

export async function deleteAdSlotAction(
  prevState: PublisherFormState,
  formData: FormData
): Promise<PublisherFormState> {
  const id = formData.get('id')?.toString();
  if (!id) return { error: 'Missing ad slot id' };

  try {
    const cookie = await getCookie();
    await deleteAdSlot(id, { cookie });
    revalidatePath('/dashboard/publisher');
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to delete ad slot' };
  }
}
