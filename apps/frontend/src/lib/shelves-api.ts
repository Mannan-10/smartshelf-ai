import type {
  ShelfLocation,
  CreateShelfPayload,
  UpdateShelfPayload,
  AuditReconcilePayload,
  AuditResult,
} from '@/types/shelf';

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

export const shelvesApi = {
  getShelves: () => {
    return apiRequest<ShelfLocation[]>('/api/shelves');
  },

  getShelf: (id: string) => {
    return apiRequest<ShelfLocation>(`/api/shelves/${id}`);
  },

  createShelf: (payload: CreateShelfPayload) => {
    return apiRequest<ShelfLocation>('/api/shelves', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateShelf: (id: string, payload: UpdateShelfPayload) => {
    return apiRequest<ShelfLocation>(`/api/shelves/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteShelf: (id: string) => {
    return apiRequest<void>(`/api/shelves/${id}`, {
      method: 'DELETE',
    });
  },

  assignProduct: (shelfId: string, productId: string) => {
    return apiRequest<void>(`/api/shelves/${shelfId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
  },

  reconcileAudit: (shelfId: string, payload: AuditReconcilePayload) => {
    return apiRequest<AuditResult>(`/api/shelves/${shelfId}/audit`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
