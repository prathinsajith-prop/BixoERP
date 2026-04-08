"use client";

import { useEffect, useState, useCallback } from "react";
import { LoadingSpinner, PageHeader, KPICard, PageErrorState } from "@erp/ui";
import { api } from "../lib/api";

export default function ManufacturingDashboardPage() {
  const [stats, setStats] = useState({ boms: 0, workOrders: 0, inProgress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [bomRes, woRes] = await Promise.all([api.bom.list(), api.workOrders.list()]);
      setStats({
        boms: bomRes.total,
        workOrders: woRes.total,
        inProgress: woRes.data.filter((o) => o.status === "in-progress").length,
        completed: woRes.data.filter((o) => o.status === "completed").length,
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
    { title: "Bill of Materials", value: stats.boms },
    { title: "Total Work Orders", value: stats.workOrders },
    { title: "In Progress", value: stats.inProgress },
    { title: "Completed", value: stats.completed },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Manufacturing Dashboard" description="Production overview" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <KPICard key={k.title} title={k.title} value={String(k.value)} />
        ))}
      </div>
    </div>
  );
}
