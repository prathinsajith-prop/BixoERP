"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { LoadingSpinner, EmptyState } from "@erp/ui";
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stock Levels</h1>
        <p className="text-sm text-gray-500 mt-1">Current inventory quantities by warehouse</p>
      </div>

      {loading && <LoadingSpinner />}
      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {levels.length === 0 ? (
            <EmptyState title="No stock data" description="No stock levels found." />
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">On Hand</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Reserved</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Available</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Alert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {levels.map((s, i) => (
                  <tr key={i} className={`hover:bg-gray-50 ${s.isBelowReorder ? "bg-red-50" : ""}`}>
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">{s.sku}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{s.itemName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{s.warehouseName}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">{s.quantityOnHand}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-500">{s.quantityReserved}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{s.quantityAvailable}</td>
                    <td className="px-4 py-3 text-center">
                      {s.isBelowReorder && <AlertTriangle className="w-4 h-4 text-red-500 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
