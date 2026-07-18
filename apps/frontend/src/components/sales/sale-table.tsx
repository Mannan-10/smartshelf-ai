'use client';

import type { Sale } from '@/types/sale';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type SaleTableProps = {
    sales: Sale[];
};

export function SaleTable({ sales }: SaleTableProps) {
    if (sales.length === 0) {
        return (
            <p className="py-12 text-center text-sm text-muted-foreground">
                No sales yet. Record your first sale above.
            </p>
        );
    }

    return (
        <Table className="min-w-[800px]">
            <TableHeader>
                <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Notes</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sales.map((s) => (
                    <TableRow key={s.id}>
                        <TableCell className="font-medium text-sm">{s.invoiceNumber}</TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {new Date(s.saleDate).toLocaleDateString('en-IN')}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                            {s.items.length} item{s.items.length !== 1 ? 's' : ''}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                            ₹{Number(s.totalAmount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                            {s.notes ?? '—'}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
