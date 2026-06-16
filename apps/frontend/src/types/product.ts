export type Category = {
    id: string;
    name: string;
    description?: string | null;
    creadtedAt?: string;
    updatedAt?: string;
    _count?:{
        Product: number;
    };
};

export type Product = {
    id: string;
    name: string;
    sku: string;
    description?: string | null;
    categoryId?: string | null;
    category?: Category | null;
    stock: number;
    reorderLevel: number;
    costPrice?: number | string | null;
    sellingPrice?: number | string | null;
    expiryDate?: string | null;
    createdAt?: string;
    updatedAt?: string;
};

export type ProductPayload = {
    name: string;
    sku: string;
    description?: string;
    categoryId?: string;
    stock: number;
    reorderLevel: number;
    costPrice?: string;
    sellingPrice?: string;
    expiryDate?: string;
};