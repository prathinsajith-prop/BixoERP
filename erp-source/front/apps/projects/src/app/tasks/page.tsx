"use client";

import { useEffect, useState, useCallback } from "react";
import { Alert, DataTable, LoadingSpinner, EmptyState, PageHeader, StatusBadge, type TableColumn } from "@erp/ui";
import { api, type ProjectTask } from "../../lib/api";

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
      <PageHeader title="Tasks" description={`${tasks.length} tasks`} />

      {loading && <LoadingSpinner />}
      {error && <Alert variant="error">{error}</Alert>}

      {!loading && !error && (() => {
        const taskColumns: TableColumn<ProjectTask>[] = [
          { key: 'name', header: 'Task', render: (t) => <span className="text-sm font-medium text-gray-900">{t.name}</span> },
          { key: 'assigneeName', header: 'Assignee', render: (t) => <span className="text-sm text-gray-500">{t.assigneeName ?? 'Unassigned'}</span> },
          { key: 'dueDate', header: 'Due', render: (t) => <span className="text-sm text-gray-500">{t.dueDate ?? '—'}</span> },
          { key: 'estimatedHours', header: 'Est. Hours', align: 'right' as const, render: (t) => <span className="text-sm text-gray-700">{t.estimatedHours ?? '—'}</span> },
          { key: 'actualHours', header: 'Actual Hours', align: 'right' as const, render: (t) => <span className="text-sm text-gray-700">{t.actualHours ?? '—'}</span> },
          {
            key: 'priority', header: 'Priority', render: (t) => <StatusBadge status={t.priority} />,
          },
          {
            key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} />,
          },
        ];
        return tasks.length === 0
          ? <EmptyState title="No tasks" description="No tasks found." />
          : <DataTable<ProjectTask> columns={taskColumns} data={tasks} keyExtractor={(t) => t.id} />;
      })()}
    </div>
  );
}
