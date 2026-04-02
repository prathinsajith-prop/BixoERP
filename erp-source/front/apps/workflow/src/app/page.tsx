"use client";

import { useEffect, useState, useCallback } from "react";
import { LoadingSpinner } from "@erp/ui";
import { api } from "../lib/api";

export default function WorkflowDashboardPage() {
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.approvals.list();
      setStats({
        total: res.total,
        pending: res.data.filter((r) => r.status === "pending").length,
        approved: res.data.filter((r) => r.status === "approved").length,
        rejected: res.data.filter((r) => r.status === "rejected").length,
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
    { title: "Total Requests", value: stats.total },
    { title: "Pending", value: stats.pending },
    { title: "Approved", value: stats.approved },
    { title: "Rejected", value: stats.rejected },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Workflow Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Approval request overview</p>
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
