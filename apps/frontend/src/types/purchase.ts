export type PurchaseItem = {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
};

export type Purchase = {
    id: string;
    vendorId: string;
    vendorName: string;
    notes?: string;
    totalAmount: number | string;
    createdAt: string;
    items: PurchaseItem[];
};

export type PurchasePayload = {
    vendorId: string;
    notes?: string;
    items: {
        productId: string;
        quantity: number;
        unitPrice: number;
    }[];
};