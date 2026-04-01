"use client";

import { useEffect, useState, useCallback } from "react";
import { LoadingSpinner, EmptyState } from "@erp/ui";
import { api, type StockMovement } from "../../lib/api";

const typeColors: Record<string, string> = {
  receipt: "bg-green-100 text-green-800",
  issue: "bg-red-100 text-red-800",
  transfer: "bg-blue-100 text-blue-800",
  adjustment: "bg-yellow-100 text-yellow-800",
};

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1>
        <p className="text-sm text-gray-500 mt-1">History of inventory transactions</p>
      </div>

      {loading && <LoadingSpinner />}
      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {movements.length === 0 ? (
            <EmptyState title="No movements" description="No stock movements recorded." />
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${typeColors[m.type] ?? "bg-gray-100 text-gray-700"}`}>{m.type}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{m.itemName}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{m.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{m.reference ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{m.reason ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(m.createdAt).toLocaleDateString()}</td>
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
