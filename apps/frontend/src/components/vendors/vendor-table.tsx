'use client';

import type { Vendor } from '@/types/vendor';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type VendorTableProps = {
  vendors: Vendor[];
  deletingId: string | null;
  onEdit: (vendor: Vendor) => void;
  onDelete: (vendor: Vendor) => void;
};

export function VendorTable({
  vendors,
  deletingId,
  onEdit,
  onDelete,
}: VendorTableProps) {
  if (vendors.length === 0) {
    return (
      <div className="rounded-xl border bg-background p-8 text-center">
        <h3 className="text-lg font-semibold">No vendors found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Add your first vendor to manage supplier details.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-background">
      <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow>
            <TableHead>Vendor</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>GST</TableHead>
            <TableHead className="w-[150px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {vendors.map((vendor) => (
            <TableRow key={vendor.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{vendor.name}</p>
                  {vendor.address && (
                    <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
                      {vendor.address}
                    </p>
                  )}
                </div>
              </TableCell>

              <TableCell>{vendor.contactName || '-'}</TableCell>
              <TableCell>{vendor.email || '-'}</TableCell>
              <TableCell>{vendor.phone || '-'}</TableCell>
              <TableCell>{vendor.gstNumber || '-'}</TableCell>

              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(vendor)}
                  >
                    Edit
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={deletingId === vendor.id}
                    onClick={() => onDelete(vendor)}
                  >
                    {deletingId === vendor.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
