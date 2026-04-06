"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { LoadingSpinner, EmptyState, PageHeader, StatusBadge, ActionButtons, type ActionButtonItem } from "@erp/ui";
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

  const pageActions: ActionButtonItem[] = [
    { key: "create", label: "New Warehouse", icon: <Plus className="h-3.5 w-3.5" />, variant: "primary", size: "sm", onClick: () => { } },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouses"
        description={`${warehouses.length} warehouses`}
        actions={<ActionButtons actions={pageActions} />}
      />

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
                <StatusBadge status={w.isActive ? "Active" : "Inactive"} />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
