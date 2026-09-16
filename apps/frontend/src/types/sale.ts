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
    paymentMethod?: string;
    customerName?: string | null;
    customerPhone?: string | null;
    notes?: string | null;
    createdAt: string;
    items: SaleItem[];
};

export type SalePayload = {
    invoiceNumber?: string;
    saleDate?: string;
    paymentMethod?: string;
    customerName?: string;
    customerPhone?: string;
    notes?: string;
    items: {
        productId: string;
        quantity: number;
        unitPrice: number;
    }[];
};