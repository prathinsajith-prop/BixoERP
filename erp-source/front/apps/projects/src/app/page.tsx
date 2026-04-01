"use client";

import { useEffect, useState, useCallback } from "react";
import { LoadingSpinner } from "@erp/ui";
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Projects Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Project and task overview</p>
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
