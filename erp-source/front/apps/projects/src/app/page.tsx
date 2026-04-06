"use client";

import { useEffect, useState, useCallback } from "react";
import { LoadingSpinner, PageHeader, KPICard } from "@erp/ui";
import { api } from "../lib/api";

export default function ProjectsDashboardPage() {
  const [stats, setStats] = useState({ projects: 0, tasks: 0, active: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [projRes, taskRes] = await Promise.all([api.projects.list(), api.tasks.list()]);
      const today = new Date().toISOString().split("T")[0];
      setStats({
        projects: projRes.total,
        tasks: taskRes.total,
        active: projRes.data.filter((p) => p.status === "active").length,
        overdue: taskRes.data.filter((t) => t.dueDate && t.dueDate < today && t.status !== "done").length,
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
    { title: "Total Projects", value: stats.projects },
    { title: "Active Projects", value: stats.active },
    { title: "Total Tasks", value: stats.tasks },
    { title: "Overdue Tasks", value: stats.overdue },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Projects Dashboard" description="Project and task overview" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <KPICard key={k.title} title={k.title} value={String(k.value)} />
        ))}
      </div>
    </div>
  );
}
