import type { Category, Product, ProductPayload } from "@/types/product";

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

export const productsApi = {
  getCategories: () => {
    return apiRequest<Category[]>("/api/categories");
  },

  getProducts: () => {
    return apiRequest<Product[]>("/api/products");
  },

  createProduct: (payload: ProductPayload) => {
    return apiRequest<Product>("/api/products", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateProduct: (id: string, payload: ProductPayload) => {
    return apiRequest<Product>(`/api/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  deleteProduct: (id: string) => {
    return apiRequest<void>(`/api/products/${id}`, {
      method: "DELETE",
    });
  },
};