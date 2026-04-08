"use client";

import { useEffect, useState, useCallback } from "react";
import { LoadingSpinner, PageHeader, KPICard, PageErrorState } from "@erp/ui";
import { api } from "../lib/api";

export default function SalesDashboardPage() {
  const [stats, setStats] = useState({ orders: 0, customers: 0, confirmed: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [ordRes, custRes] = await Promise.all([api.orders.list(), api.customers.list()]);
      setStats({
        orders: ordRes.total,
        customers: custRes.total,
        confirmed: ordRes.data.filter((o) => o.status === "confirmed" || o.status === "shipped" || o.status === "delivered").length,
        pending: ordRes.data.filter((o) => o.status === "draft").length,
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
  if (error) return <PageErrorState error={error} onRetry={load} />;

  const kpis = [
    { title: "Total Orders", value: stats.orders },
    { title: "Total Customers", value: stats.customers },
    { title: "Confirmed Orders", value: stats.confirmed },
    { title: "Pending Orders", value: stats.pending },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Sales Dashboard" description="Orders and customer overview" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <KPICard key={k.title} title={k.title} value={String(k.value)} />
        ))}
      </div>
    </div>
  );
}
