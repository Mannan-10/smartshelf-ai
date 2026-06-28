import { Purchase, PurchasePayload } from "@/types/purchase";

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
        throw new Error(data?.message || 'An error occurred while processing the request.');
    }

    return data as T;
}

export const purchasesApi = {
    getPurchases: () => {
        return apiRequest<Purchase[]>('/api/purchases');
    },

    createPurchase: (payload: PurchasePayload) => {
        return apiRequest<Purchase>('/api/purchases', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }
};
