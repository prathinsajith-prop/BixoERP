"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { Alert, DataTable, LoadingSpinner, EmptyState, PageHeader, type TableColumn } from "@erp/ui";
import { api, type StockLevel } from "../../lib/api";

export default function StockLevelsPage() {
  const [levels, setLevels] = useState<StockLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.stock.levels();
      setLevels(res.data);
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load stock levels");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader title="Stock Levels" description="Current inventory quantities by warehouse" />

      {loading && <LoadingSpinner />}
      {error && <Alert variant="error">{error}</Alert>}

      {!loading && !error && (() => {
        const stockColumns: TableColumn<StockLevel>[] = [
          { key: 'sku', header: 'SKU', render: (s) => <span className="text-sm font-mono text-gray-700">{s.sku}</span> },
          { key: 'itemName', header: 'Item', render: (s) => <span className="text-sm text-gray-900">{s.itemName}</span> },
          { key: 'warehouseName', header: 'Warehouse', render: (s) => <span className="text-sm text-gray-500">{s.warehouseName}</span> },
          { key: 'quantityOnHand', header: 'On Hand', align: 'right' as const, render: (s) => <span className="text-sm text-gray-900">{s.quantityOnHand}</span> },
          { key: 'quantityReserved', header: 'Reserved', align: 'right' as const, render: (s) => <span className="text-sm text-gray-500">{s.quantityReserved}</span> },
          { key: 'quantityAvailable', header: 'Available', align: 'right' as const, render: (s) => <span className="text-sm font-medium text-gray-900">{s.quantityAvailable}</span> },
          {
            key: 'isBelowReorder', header: 'Alert', align: 'center' as const, render: (s) => (
              s.isBelowReorder ? <AlertTriangle className="w-4 h-4 text-red-500 mx-auto" /> : null
            )
          },
        ];
        return levels.length === 0
          ? <EmptyState title="No stock data" description="No stock levels found." />
          : <DataTable<StockLevel> columns={stockColumns} data={levels} keyExtractor={(s, i) => String(i)} />;
      })()}
    </div>
  );
}
