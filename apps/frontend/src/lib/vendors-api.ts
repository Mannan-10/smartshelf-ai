import type { Vendor, VendorPayload } from '@/types/vendor';

async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (response.status === 204) {
    return null as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Request failed');
  }

  return data as T;
}

export const vendorsApi = {
  getVendors: () => {
    return apiRequest<Vendor[]>('/api/vendors');
  },

  createVendor: (payload: VendorPayload) => {
    return apiRequest<Vendor>('/api/vendors', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateVendor: (id: string, payload: VendorPayload) => {
    return apiRequest<Vendor>(`/api/vendors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteVendor: (id: string) => {
    return apiRequest<void>(`/api/vendors/${id}`, {
      method: 'DELETE',
    });
  },
};