import type { Sale, SalePayload } from '@/types/sale';

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

export const salesApi = {
    getSales: () => {
        return apiRequest<Sale[]>('/api/sales');
    },

    createSale: (payload: SalePayload) => {
        return apiRequest<Sale>('/api/sales', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },
};