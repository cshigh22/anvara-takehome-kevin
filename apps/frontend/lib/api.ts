// Simple API client
// FIXME: This client has no error response parsing - when API returns { error: "..." },
// we should extract and throw that message instead of generic "API request failed"

import type { AdSlot, Campaign, Placement } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4291';

export type ApiOptions = RequestInit & {
  /** Forward cookies when calling from server (e.g. from headers()). */
  cookie?: string;
};

export async function api<T>(endpoint: string, options?: ApiOptions): Promise<T> {
  const { cookie, ...init } = options ?? {};
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers ?? {}),
  };
  if (cookie) (headers as Record<string, string>)['Cookie'] = cookie;

  const res = await fetch(`${API_URL}${endpoint}`, {
    credentials: 'include',
    ...init,
    headers,
  });
  if (!res.ok) throw new Error('API request failed');
  return res.json();
}

// Campaigns (pass options.cookie when calling from server to forward session)
export const getCampaigns = (sponsorId?: string, options?: ApiOptions) =>
  api<Campaign[]>(sponsorId ? `/api/campaigns?sponsorId=${sponsorId}` : '/api/campaigns', options);
export const getCampaign = (id: string, options?: ApiOptions) =>
  api<Campaign>(`/api/campaigns/${id}`, options);
export const createCampaign = (data: Record<string, unknown>, options?: ApiOptions) =>
  api<Campaign>('/api/campaigns', { method: 'POST', body: JSON.stringify(data), ...options });
export const updateCampaign = (id: string, data: Record<string, unknown>, options?: ApiOptions) =>
  api<Campaign>(`/api/campaigns/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options,
  });
export async function deleteCampaign(id: string, options?: ApiOptions): Promise<void> {
  const { cookie, ...init } = options ?? {};
  const headers: HeadersInit = { ...(init.headers ?? {}) };
  if (cookie) (headers as Record<string, string>)['Cookie'] = cookie;
  const res = await fetch(`${API_URL}/api/campaigns/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    ...init,
    headers,
  });
  if (!res.ok) throw new Error('API request failed');
}

// Ad Slots (pass options.cookie when calling from server to forward session)
export const getAdSlots = (publisherId?: string, options?: ApiOptions) =>
  api<AdSlot[]>(
    publisherId ? `/api/ad-slots?publisherId=${publisherId}` : '/api/ad-slots',
    options
  );
export const getAdSlot = (id: string, options?: ApiOptions) =>
  api<AdSlot>(`/api/ad-slots/${id}`, options);
export const createAdSlot = (data: Record<string, unknown>, options?: ApiOptions) =>
  api<AdSlot>('/api/ad-slots', { method: 'POST', body: JSON.stringify(data), ...options });
export const updateAdSlot = (id: string, data: Record<string, unknown>, options?: ApiOptions) =>
  api<AdSlot>(`/api/ad-slots/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options,
  });
export async function deleteAdSlot(id: string, options?: ApiOptions): Promise<void> {
  const { cookie, ...init } = options ?? {};
  const headers: HeadersInit = { ...(init.headers ?? {}) };
  if (cookie) (headers as Record<string, string>)['Cookie'] = cookie;
  const res = await fetch(`${API_URL}/api/ad-slots/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    ...init,
    headers,
  });
  if (!res.ok) throw new Error('API request failed');
}

// Placements
export const getPlacements = () => api<Placement[]>('/api/placements');
export const createPlacement = (data: Record<string, unknown>) =>
  api<Placement>('/api/placements', { method: 'POST', body: JSON.stringify(data) });

// Dashboard
export const getStats = () => api<Record<string, unknown>>('/api/dashboard/stats');
