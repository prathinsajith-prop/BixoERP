"use client";

import { useEffect, useState, useCallback } from "react";
import { LoadingSpinner, EmptyState } from "@erp/ui";
import { api, type ProjectTask } from "../../lib/api";

const statusColors: Record<string, string> = {
  todo: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-800",
  review: "bg-yellow-100 text-yellow-800",
  done: "bg-green-100 text-green-800",
  blocked: "bg-red-100 text-red-800",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-800",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.tasks.list();
      setTasks(res.data);
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <p className="text-sm text-gray-500 mt-1">{tasks.length} tasks</p>
      </div>

      {loading && <LoadingSpinner />}
      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {tasks.length === 0 ? (
            <EmptyState title="No tasks" description="No tasks found." />
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Est. Hours</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actual Hours</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{t.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{t.assigneeName ?? "Unassigned"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{t.dueDate ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">{t.estimatedHours ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">{t.actualHours ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${priorityColors[t.priority] ?? "bg-gray-100 text-gray-600"}`}>{t.priority}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[t.status] ?? "bg-gray-100 text-gray-700"}`}>{t.status}</span>
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
