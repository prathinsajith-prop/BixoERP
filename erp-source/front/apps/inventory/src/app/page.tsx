"use client";

import { useEffect, useState, useCallback } from "react";
import { LoadingSpinner, PageHeader, KPICard } from "@erp/ui";
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
      <PageHeader title="Inventory Dashboard" description="Stock levels and movement overview" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <KPICard key={k.title} title={k.title} value={String(k.value)} />
        ))}
      </div>
    </div>
  );
}
