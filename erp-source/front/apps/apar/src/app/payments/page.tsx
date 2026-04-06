"use client";

import { useEffect, useState, useCallback } from "react";
import { DataTable, LoadingSpinner, EmptyState, PageHeader, StatusBadge, type TableColumn } from "@erp/ui";
import { api, type Payment } from "../../lib/api";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.payments.list();
      setPayments(res.data);
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description={`${payments.length} payments`} />

      {loading && <LoadingSpinner />}
      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {!loading && !error && (() => {
        const paymentColumns: TableColumn<Payment>[] = [
          { key: 'paymentNumber', header: 'Payment #', render: (p) => <span className="text-sm font-medium text-accent-600">{p.paymentNumber}</span> },
          {
            key: 'type', header: 'Type', render: (p) => <StatusBadge status={p.type} />,
          },
          { key: 'paymentDate', header: 'Date', render: (p) => <span className="text-sm text-gray-500">{p.paymentDate}</span> },
          { key: 'method', header: 'Method', render: (p) => <span className="text-sm text-gray-500 capitalize">{p.method}</span> },
          { key: 'reference', header: 'Reference', render: (p) => <span className="text-sm text-gray-500">{p.reference ?? '—'}</span> },
          {
            key: 'amount', header: 'Amount', align: 'right' as const, render: (p) => (
              <span className="text-sm font-medium text-gray-900">{p.amount.currency} {p.amount.amount.toLocaleString()}</span>
            )
          },
        ];
        return payments.length === 0
          ? <EmptyState title="No payments" description="No payments recorded yet." />
          : <DataTable<Payment> columns={paymentColumns} data={payments} keyExtractor={(p) => p.id} />;
      })()}
    </div>
  );
}
