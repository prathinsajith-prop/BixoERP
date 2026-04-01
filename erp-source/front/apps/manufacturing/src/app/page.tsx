"use client";

import { useEffect, useState, useCallback } from "react";
import { LoadingSpinner } from "@erp/ui";
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
  if (error) return <div className="p-6 text-sm text-red-600">{error}</div>;

  const kpis = [
    { title: "Bill of Materials", value: stats.boms },
    { title: "Total Work Orders", value: stats.workOrders },
    { title: "In Progress", value: stats.inProgress },
    { title: "Completed", value: stats.completed },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manufacturing Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Production overview</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.title} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm font-medium text-gray-500">{k.title}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{k.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
