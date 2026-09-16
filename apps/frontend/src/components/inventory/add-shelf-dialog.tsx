'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { shelvesApi } from '@/lib/shelves-api';
import { Plus, MapPin } from 'lucide-react';

type Props = {
  onSuccess: () => void;
};

export function AddShelfDialog({ onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [aisle, setAisle] = useState('Aisle 1');
  const [rack, setRack] = useState('Rack A');
  const [shelf, setShelf] = useState('Shelf 1');
  const [bin, setBin] = useState('');
  const [capacity, setCapacity] = useState(100);
  const [notes, setNotes] = useState('');

  // Clean code preview
  const clean = (val: string) =>
    val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
  const previewCode = `${clean(aisle) || 'A1'}-${clean(rack) || 'RA'}-${clean(shelf) || 'S1'}${
    bin ? `-${clean(bin)}` : ''
  }`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await shelvesApi.createShelf({
        code: previewCode,
        aisle,
        rack,
        shelf,
        bin: bin.trim() || undefined,
        capacity: Number(capacity) || 100,
        notes: notes.trim() || undefined,
      });

      setOpen(false);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create shelf');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5 shadow-sm text-xs sm:text-sm h-9">
          <Plus className="h-4 w-4" />
          <span>Add Shelf Location</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-5 w-5 text-primary" />
            New Shelf / Bin Location
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-md">
              {error}
            </div>
          )}

          {/* Generated Code Preview Callout */}
          <div className="p-3 bg-muted/60 border rounded-lg flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Generated Code:</span>
            <span className="font-mono font-bold text-sm tracking-wider text-primary">
              {previewCode}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Aisle</Label>
              <Input
                placeholder="e.g. Aisle 1"
                value={aisle}
                onChange={(e) => setAisle(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Rack</Label>
              <Input
                placeholder="e.g. Rack A"
                value={rack}
                onChange={(e) => setRack(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Shelf</Label>
              <Input
                placeholder="e.g. Shelf 1"
                value={shelf}
                onChange={(e) => setShelf(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Bin / Slot (Optional)</Label>
              <Input
                placeholder="e.g. Bin B1"
                value={bin}
                onChange={(e) => setBin(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Capacity (Max Units)</Label>
            <Input
              type="number"
              min="1"
              max="10000"
              value={capacity}
              onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value) || 1))}
              required
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Notes</Label>
            <Input
              placeholder="e.g. Near checkout counter, refrigerated"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Shelf'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
