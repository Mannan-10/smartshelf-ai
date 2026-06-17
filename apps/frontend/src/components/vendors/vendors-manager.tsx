'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Vendor } from '@/types/vendor';
import { vendorsApi } from '@/lib/vendors-api';

import { AddVendorDialog } from './add-vendor-dialog';
import { EditVendorDialog } from './edit-vendor-dialog';
import { VendorTable } from './vendor-table';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function VendorsManager() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  const loadVendors = useCallback(async () => {
    setIsLoading(true);
    setPageError('');

    try {
      const vendorsResponse = await vendorsApi.getVendors();
      setVendors(vendorsResponse);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : 'Unable to load vendors',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVendors();
  }, [loadVendors]);

  const handleDeleteVendor = async (vendor: Vendor) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${vendor.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(vendor.id);
    setPageError('');

    try {
      await vendorsApi.deleteVendor(vendor.id);
      await loadVendors();
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : 'Unable to delete vendor',
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Vendors</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Total vendors: {vendors.length}
            </p>
          </div>

          <AddVendorDialog onVendorCreated={loadVendors} />
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">
            Manage suppliers, vendor contacts, GST details, and addresses.
          </p>
        </CardContent>
      </Card>

      {pageError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {pageError}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-xl border bg-background p-8 text-center text-sm text-muted-foreground">
          Loading vendors...
        </div>
      ) : (
        <VendorTable
          vendors={vendors}
          deletingId={deletingId}
          onEdit={setEditingVendor}
          onDelete={handleDeleteVendor}
        />
      )}

      <EditVendorDialog
        vendor={editingVendor}
        open={Boolean(editingVendor)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingVendor(null);
          }
        }}
        onVendorUpdated={loadVendors}
      />
    </div>
  );
}