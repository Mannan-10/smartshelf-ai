'use client';

import type { Purchase } from '@/types/purchase';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

type PurchaseTableProps = {
    purchases: Purchase[];
};

export function PurchaseTable({ purchases }: PurchaseTableProps) {
    if (purchases.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <svg className="h-7 w-7 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                    </svg>
                </div>
                <h3 className="text-base font-semibold">No purchase orders yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Create your first purchase order using the button above.
                </p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-semibold text-foreground">Date</TableHead>
                    <TableHead className="font-semibold text-foreground">Vendor</TableHead>
                    <TableHead className="font-semibold text-foreground">Items</TableHead>
                    <TableHead className="text-right font-semibold text-foreground">Total Amount</TableHead>
                    <TableHead className="font-semibold text-foreground">Notes</TableHead>
                    <TableHead className="font-semibold text-foreground">Order #</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {purchases.map((p) => {
                    const totalAmount = Number(p.totalAmount);
                    const date = new Date(p.createdAt);

                    return (
                        <TableRow key={p.id} className="group transition-colors hover:bg-muted/30">
                            {/* Date */}
                            <TableCell className="whitespace-nowrap">
                                <div>
                                    <p className="text-sm font-medium">
                                        {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </TableCell>

                            {/* Vendor */}
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                        {(p.vendorName || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-medium">{p.vendorName || '—'}</span>
                                </div>
                            </TableCell>

                            {/* Items */}
                            <TableCell>
                                <Badge variant="secondary" className="tabular-nums">
                                    {p.items.length} {p.items.length === 1 ? 'item' : 'items'}
                                </Badge>
                            </TableCell>

                            {/* Total */}
                            <TableCell className="text-right">
                                <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                                    ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </TableCell>

                            {/* Notes */}
                            <TableCell className="max-w-[160px] truncate text-sm text-muted-foreground">
                                {p.notes || <span className="italic opacity-50">—</span>}
                            </TableCell>

                            {/* Order number */}
                            <TableCell>
                                <span className="font-mono text-xs text-muted-foreground">
                                    {p.id.slice(0, 8).toUpperCase()}
                                </span>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}