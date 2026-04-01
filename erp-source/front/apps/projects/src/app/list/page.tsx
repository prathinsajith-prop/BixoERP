"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { LoadingSpinner, EmptyState } from "@erp/ui";
import { api, type Project } from "../../lib/api";

const statusColors: Record<string, string> = {
  planning: "bg-gray-100 text-gray-700",
  active: "bg-green-100 text-green-800",
  on_hold: "bg-yellow-100 text-yellow-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.projects.list();
      setProjects(res.data);
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">{projects.length} projects</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-accent-600 text-white text-sm font-medium rounded-lg hover:bg-accent-700">
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {loading && <LoadingSpinner />}
      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {projects.length === 0 ? (
            <EmptyState title="No projects" description="No projects have been created yet." />
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manager</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Budget</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Complete</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">{p.code}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.managerName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.startDate}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.endDate ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      {p.budget.currency} {p.budget.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">{p.completionPercentage}%</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[p.status] ?? "bg-gray-100 text-gray-700"}`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
