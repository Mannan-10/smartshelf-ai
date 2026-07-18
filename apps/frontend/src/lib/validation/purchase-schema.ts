import { z } from 'zod';

export const purchaseItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.coerce.number().int().positive('Quantity must be at least 1'),
  unitCost: z.coerce.number().positive('Unit price must be greater than 0'),  
});

export const purchaseSchema = z.object({
    vendorId: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(purchaseItemSchema).min(1, 'Add at least one item'),
});

export type PurchaseItemValues = z.infer<typeof purchaseItemSchema>;
export type PurchaseFormValues = z.infer<typeof purchaseSchema>;
