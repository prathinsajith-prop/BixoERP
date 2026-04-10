"use client";

import { useEffect, useState, useCallback } from "react";
import { Alert, DataTable, LoadingSpinner, EmptyState, PageHeader, StatusBadge, type TableColumn } from "@erp/ui";
import { api, type StockMovement } from "../../lib/api";

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.movements.list();
      setMovements(res.data);
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load movements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader title="Stock Movements" description="History of inventory transactions" />

      {loading && <LoadingSpinner />}
      {error && <Alert variant="error">{error}</Alert>}

      {!loading && !error && (() => {
        const movementColumns: TableColumn<StockMovement>[] = [
          {
            key: 'type', header: 'Type', render: (m) => <StatusBadge status={m.type} />,
          },
          { key: 'itemName', header: 'Item', render: (m) => <span className="text-sm text-gray-900">{m.itemName}</span> },
          { key: 'quantity', header: 'Qty', align: 'right' as const, render: (m) => <span className="text-sm font-medium text-gray-900">{m.quantity}</span> },
          { key: 'reference', header: 'Reference', render: (m) => <span className="text-sm text-gray-500">{m.reference ?? '—'}</span> },
          { key: 'reason', header: 'Reason', render: (m) => <span className="text-sm text-gray-500">{m.reason ?? '—'}</span> },
          { key: 'createdAt', header: 'Date', render: (m) => <span className="text-sm text-gray-500">{new Date(m.createdAt).toLocaleDateString()}</span> },
        ];
        return movements.length === 0
          ? <EmptyState title="No movements" description="No stock movements recorded." />
          : <DataTable<StockMovement> columns={movementColumns} data={movements} keyExtractor={(m) => m.id} />;
      })()}
    </div>
  );
}
