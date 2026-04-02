"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { LoadingSpinner } from "@erp/ui";
import { api } from "../lib/api";

export default function InventoryDashboardPage() {
  const [stats, setStats] = useState({ items: 0, warehouses: 0, belowReorder: 0, movements: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [itemRes, whRes, stockRes, movRes] = await Promise.all([
        api.items.list(),
        api.warehouses.list(),
        api.stock.levels(),
        api.movements.list(),
      ]);
      setStats({
        items: itemRes.total,
        warehouses: whRes.total,
        belowReorder: stockRes.data.filter((s) => s.isBelowReorder).length,
        movements: movRes.total,
      });
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-6 text-sm text-red-600">{error}</div>;

  const kpis = [
    { title: "Total Items", value: stats.items, alert: false },
    { title: "Warehouses", value: stats.warehouses, alert: false },
    { title: "Below Reorder", value: stats.belowReorder, alert: stats.belowReorder > 0 },
    { title: "Movements", value: stats.movements, alert: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Stock levels and movement overview</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.title} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">{k.title}</p>
              {k.alert && <AlertTriangle className="w-4 h-4 text-red-500" />}
            </div>
            <p className={`mt-1 text-2xl font-bold ${k.alert ? "text-red-600" : "text-gray-900"}`}>{k.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
