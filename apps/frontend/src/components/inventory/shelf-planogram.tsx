'use client';

import { useState, useMemo } from 'react';
import type { ShelfLocation } from '@/types/shelf';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AddShelfDialog } from './add-shelf-dialog';
import { ShelfAuditDialog } from './shelf-audit-dialog';
import { BarcodeLabelDialog } from '@/components/products/barcode-label-dialog';
import { shelvesApi } from '@/lib/shelves-api';
import {
  Layers,
  MapPin,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  Barcode,
  Trash2,
  Search,
  Filter,
} from 'lucide-react';

type Props = {
  shelves: ShelfLocation[];
  onRefresh: () => void;
};

export function ShelfPlanogram({ shelves, onRefresh }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAisle, setSelectedAisle] = useState('ALL');
  const [auditingShelf, setAuditingShelf] = useState<ShelfLocation | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Extract distinct aisles
  const aisles = useMemo(() => {
    const set = new Set<string>();
    shelves.forEach((s) => set.add(s.aisle));
    return Array.from(set).sort();
  }, [shelves]);

  // Filtered shelves
  const filteredShelves = useMemo(() => {
    return shelves.filter((s) => {
      const matchesAisle = selectedAisle === 'ALL' || s.aisle === selectedAisle;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.code.toLowerCase().includes(q) ||
        s.aisle.toLowerCase().includes(q) ||
        s.rack.toLowerCase().includes(q) ||
        s.shelf.toLowerCase().includes(q) ||
        (s.products && s.products.some((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)));

      return matchesAisle && matchesSearch;
    });
  }, [shelves, selectedAisle, searchQuery]);

  // Overall statistics
  const totalShelves = shelves.length;
  const avgOccupancy =
    totalShelves > 0
      ? Math.round(shelves.reduce((acc, s) => acc + s.occupancyPercentage, 0) / totalShelves)
      : 0;
  const criticalCount = shelves.filter((s) => s.status === 'CRITICAL').length;
  const warningCount = shelves.filter((s) => s.status === 'WARNING').length;
  const healthyCount = shelves.filter((s) => s.status === 'NORMAL').length;

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shelf location? Products will be unassigned.')) return;
    setDeletingId(id);
    try {
      await shelvesApi.deleteShelf(id);
      onRefresh();
    } catch {
      alert('Failed to delete shelf.');
    } finally {
      setDeletingId(null);
    }
  };

  const openAudit = (shelf: ShelfLocation) => {
    setAuditingShelf(shelf);
    setAuditOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Add */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <span>Interactive 2D Shelf Planogram</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time physical store rack mapping, shelf capacity meters, and cycle counting audits.
          </p>
        </div>

        <AddShelfDialog onSuccess={onRefresh} />
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="border rounded-xl p-3.5 bg-background shadow-sm">
          <span className="text-[11px] font-bold text-muted-foreground uppercase">Total Shelves</span>
          <div className="text-2xl font-extrabold text-foreground mt-1">{totalShelves}</div>
          <span className="text-[10px] text-muted-foreground">{aisles.length} Aisles mapped</span>
        </div>

        <div className="border rounded-xl p-3.5 bg-background shadow-sm">
          <span className="text-[11px] font-bold text-muted-foreground uppercase">Avg Occupancy</span>
          <div className="text-2xl font-extrabold text-foreground mt-1">{avgOccupancy}%</div>
          <div className="w-full bg-muted rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(100, avgOccupancy)}%` }} />
          </div>
        </div>

        <div className="border rounded-xl p-3.5 bg-background shadow-sm">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Healthy Shelves</span>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{healthyCount}</div>
          <span className="text-[10px] text-muted-foreground">Optimal capacity & fresh</span>
        </div>

        <div className="border rounded-xl p-3.5 bg-background shadow-sm">
          <span className="text-[11px] font-bold text-amber-600 uppercase">Attention Needed</span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{warningCount + criticalCount}</div>
          <span className="text-[10px] text-muted-foreground">{criticalCount} critical / {warningCount} low stock</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/40 p-3 rounded-xl border">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search by shelf code, rack, or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border rounded-md px-2.5 py-1 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Aisle:</span>
          <select
            value={selectedAisle}
            onChange={(e) => setSelectedAisle(e.target.value)}
            className="bg-background border rounded-md px-2.5 py-1 text-xs font-medium"
          >
            <option value="ALL">All Aisles ({shelves.length})</option>
            {aisles.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2D Planogram Grid */}
      {filteredShelves.length === 0 ? (
        <div className="py-16 text-center border rounded-xl bg-background">
          <MapPin className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-foreground">No Shelf Locations Found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {searchQuery || selectedAisle !== 'ALL'
              ? 'No shelves match your search criteria. Try clearing filters.'
              : 'Add your first shelf location to start mapping your retail store or warehouse layout.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShelves.map((s) => {
            const isFull = s.occupancyPercentage >= 95;
            const isLow = s.occupancyPercentage < 20;

            const progressColor =
              s.status === 'CRITICAL'
                ? 'bg-destructive'
                : s.status === 'WARNING'
                ? 'bg-amber-500'
                : 'bg-emerald-500';

            return (
              <div
                key={s.id}
                className="border rounded-xl bg-background p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3"
              >
                {/* Shelf Header */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-sm text-foreground">{s.code}</span>
                        {s.status === 'NORMAL' && (
                          <span className="h-2 w-2 rounded-full bg-emerald-500" title="Normal" />
                        )}
                        {s.status === 'WARNING' && (
                          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" title="Warning" />
                        )}
                        {s.status === 'CRITICAL' && (
                          <span className="h-2 w-2 rounded-full bg-destructive animate-ping" title="Critical" />
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {s.aisle} • {s.rack} • {s.shelf}
                        {s.bin && ` • ${s.bin}`}
                      </div>
                    </div>

                    <Badge
                      variant={
                        s.status === 'CRITICAL'
                          ? 'destructive'
                          : s.status === 'WARNING'
                          ? 'outline'
                          : 'secondary'
                      }
                      className="text-[10px] uppercase font-bold"
                    >
                      {s.status}
                    </Badge>
                  </div>

                  {/* Occupancy Meter */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Occupancy</span>
                      <span className="font-bold text-foreground font-mono">
                        {s.currentStock} / {s.capacity} units ({s.occupancyPercentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className={`${progressColor} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(100, s.occupancyPercentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Stored Products List */}
                  <div className="mt-3 pt-2.5 border-t space-y-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                      Assigned Products ({s.products?.length || 0})
                    </span>

                    {(!s.products || s.products.length === 0) ? (
                      <div className="text-[11px] text-muted-foreground italic py-1">
                        Empty shelf slot. Assign products from catalog.
                      </div>
                    ) : (
                      <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                        {s.products.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/40"
                          >
                            <span className="truncate font-medium pr-2 max-w-[140px]">{p.name}</span>
                            <span className="font-mono text-[10px] text-muted-foreground font-bold shrink-0">
                              {p.stock} pcs
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Expiry alerts on shelf */}
                    {s.expiredBatchCount > 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-destructive font-semibold mt-1">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span>{s.expiredBatchCount} expired batch on shelf!</span>
                      </div>
                    )}
                    {s.expiringSoonBatchCount > 0 && s.expiredBatchCount === 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold mt-1">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span>{s.expiringSoonBatchCount} batch expiring within 30d</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shelf Actions Bar */}
                <div className="flex items-center justify-between pt-2 border-t mt-2">
                  <BarcodeLabelDialog
                    productName={`Shelf: ${s.code}`}
                    sku={s.code}
                    sellingPrice={0}
                    categoryName={`${s.aisle} • ${s.rack}`}
                    trigger={
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] gap-1">
                        <Barcode className="h-3 w-3" />
                        <span>Tag</span>
                      </Button>
                    }
                  />

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAudit(s)}
                      className="h-7 px-2.5 text-[11px] gap-1"
                    >
                      <ClipboardCheck className="h-3 w-3" />
                      <span>Audit</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(s.id)}
                      disabled={deletingId === s.id}
                      className="h-7 px-2 text-[11px] text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cycle Count Audit Modal */}
      <ShelfAuditDialog
        shelf={auditingShelf}
        open={auditOpen}
        onOpenChange={setAuditOpen}
        onSuccess={onRefresh}
      />
    </div>
  );
}
