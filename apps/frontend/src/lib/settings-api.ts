export type ShopSettings = {
  id: string;
  shopName: string;
  contactEmail: string | null;
  currency: string;
  address: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateSettingsPayload = {
  shopName?: string;
  contactEmail?: string;
  currency?: string;
  address?: string;
};

async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (response.status === 204) {
    return null as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Request failed");
  }

  return data as T;
}

export const settingsApi = {
  getSettings: () => {
    return apiRequest<ShopSettings>("/api/settings");
  },

  updateSettings: (payload: UpdateSettingsPayload) => {
    return apiRequest<ShopSettings>("/api/settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
};
