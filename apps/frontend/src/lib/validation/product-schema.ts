import { z } from "zod";

const emptyToUndefined = (value: unknown) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return value;
};

const requiredInteger = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return 0;
    }

    return Number(value);
  },
  z.number().int("Value must be a whole number").min(0, "Value cannot be negative")
);

const optionalNumber = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }

    return Number(value);
  },
  z.number().min(0, "Value cannot be negative").optional()
);

export const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Product name must be at least 2 characters")
    .max(120, "Product name must be less than 120 characters"),

  sku: z
    .string()
    .trim()
    .min(2, "SKU must be at least 2 characters")
    .max(60, "SKU must be less than 60 characters"),

  description: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(255, "Description must be less than 255 characters").optional()
  ),

  categoryId: z.preprocess(emptyToUndefined, z.string().optional()),

  stock: requiredInteger,

  reorderLevel: requiredInteger,

  costPrice: optionalNumber,

  sellingPrice: optionalNumber,

  expiryDate: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Expiry date must be a valid date")
      .optional()
  ),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const defaultProductFormValues: ProductFormValues = {
  name: "",
  sku: "",
  description: undefined,
  categoryId: undefined,
  stock: 0,
  reorderLevel: 10,
  costPrice: undefined,
  sellingPrice: undefined,
  expiryDate: undefined,
};