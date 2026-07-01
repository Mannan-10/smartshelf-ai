import { z } from 'zod';

export const saleItemSchema = z.object({
    productId: z.string().min(1, 'Product is required'),
    quantity: z.coerce.number().int().positive('Quantity must be at least 1'),
    unitPrice: z.coerce.number().positive('Unit price must be greater than 0'),
});

export const saleSchema = z.object({
    notes: z.string().optional(),
    items: z.array(saleItemSchema).min(1, 'Add at least one item'),
});

export type SaleItemValues = z.infer<typeof saleItemSchema>;
export type SaleFormValues = z.infer<typeof saleSchema>;