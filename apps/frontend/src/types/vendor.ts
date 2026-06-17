export type Vendor = {
  id: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  gstNumber?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VendorPayload = {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  notes?: string;
};