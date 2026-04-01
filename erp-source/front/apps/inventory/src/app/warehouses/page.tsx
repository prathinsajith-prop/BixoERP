"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { LoadingSpinner, EmptyState } from "@erp/ui";
import { api, type Warehouse } from "../../lib/api";

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.warehouses.list();
      setWarehouses(res.data);
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load warehouses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
          <p className="text-sm text-gray-500 mt-1">{warehouses.length} warehouses</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-accent-600 text-white text-sm font-medium rounded-lg hover:bg-accent-700">
          <Plus className="w-4 h-4" />
          New Warehouse
        </button>
      </div>

      {loading && <LoadingSpinner />}
      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.length === 0 ? (
            <EmptyState title="No warehouses" description="No warehouses configured yet." />
          ) : (
            warehouses.map((w) => (
              <div key={w.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-900">{w.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{w.code}</p>
                {w.address && <p className="text-xs text-gray-400 mt-2">{w.address}</p>}
                <span className={`mt-3 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${w.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                  {w.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
