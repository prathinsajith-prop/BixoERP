"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { LoadingSpinner, EmptyState } from "@erp/ui";
import { api, type BillOfMaterials } from "../../lib/api";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  active: "bg-green-100 text-green-800",
  obsolete: "bg-red-100 text-red-800",
};

export default function BOMPage() {
  const [boms, setBoms] = useState<BillOfMaterials[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.bom.list();
      setBoms(res.data);
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load bill of materials");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bill of Materials</h1>
          <p className="text-sm text-gray-500 mt-1">{boms.length} BOMs</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-accent-600 text-white text-sm font-medium rounded-lg hover:bg-accent-700">
          <Plus className="w-4 h-4" />
          New BOM
        </button>
      </div>

      {loading && <LoadingSpinner />}
      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {boms.length === 0 ? (
            <EmptyState title="No BOMs" description="No bill of materials created yet." />
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Version</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Components</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {boms.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{b.productName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{b.version}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700">{b.components.length}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[b.status] ?? "bg-gray-100 text-gray-700"}`}>{b.status}</span>
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
