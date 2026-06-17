import { z } from 'zod';

const emptyToUndefined = (value: unknown) => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  return value;
};

export const vendorFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Vendor name must be at least 2 characters')
    .max(120, 'Vendor name must be less than 120 characters'),

  contactName: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(120, 'Contact name must be less than 120 characters').optional(),
  ),

  email: z.preprocess(
    emptyToUndefined,
    z.string().trim().email('Enter a valid email address').max(120).optional(),
  ),

  phone: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(20, 'Phone number must be less than 20 characters').optional(),
  ),

  address: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(255, 'Address must be less than 255 characters').optional(),
  ),

  gstNumber: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(30, 'GST number must be less than 30 characters').optional(),
  ),

  notes: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(255, 'Notes must be less than 255 characters').optional(),
  ),
});

export type VendorFormValues = z.infer<typeof vendorFormSchema>;

export const defaultVendorFormValues: VendorFormValues = {
  name: '',
  contactName: undefined,
  email: undefined,
  phone: undefined,
  address: undefined,
  gstNumber: undefined,
  notes: undefined,
};