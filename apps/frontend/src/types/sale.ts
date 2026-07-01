export type SaleItem = {
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product: {
        id: string;
        name: string;
    };
};

export type Sale = {
    id: string;
    invoiceNumber: string;
    saleDate: string;
    totalAmount: number;
    notes?: string | null;
    createdAt: string;
    items: SaleItem[];
};

export type SalePayload = {
    invoiceNumber?: string;
    saleDate?: string;
    notes?: string;
    items: {
        productId: string;
        quantity: number;
        unitPrice: number;
    }[];
};