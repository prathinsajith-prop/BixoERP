"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { Alert, DataTable, LoadingSpinner, EmptyState, PageHeader, StatusBadge, ActionButtons, type ActionButtonItem, type TableColumn } from "@erp/ui";
import { api, type Project } from "../../lib/api";

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

  const pageActions: ActionButtonItem[] = [
    { key: "create", label: "New Project", icon: <Plus className="h-3.5 w-3.5" />, variant: "primary", size: "sm", onClick: () => { } },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description={`${projects.length} projects`}
        actions={<ActionButtons actions={pageActions} />}
      />

      {loading && <LoadingSpinner />}
      {error && <Alert variant="error">{error}</Alert>}

      {!loading && !error && (() => {
        const projectColumns: TableColumn<Project>[] = [
          { key: 'code', header: 'Code', render: (p) => <span className="text-sm font-mono text-gray-700">{p.code}</span> },
          { key: 'name', header: 'Name', render: (p) => <span className="text-sm font-medium text-gray-900">{p.name}</span> },
          { key: 'managerName', header: 'Manager', render: (p) => <span className="text-sm text-gray-500">{p.managerName}</span> },
          { key: 'startDate', header: 'Start', render: (p) => <span className="text-sm text-gray-500">{p.startDate}</span> },
          { key: 'endDate', header: 'End', render: (p) => <span className="text-sm text-gray-500">{p.endDate ?? '—'}</span> },
          {
            key: 'budget', header: 'Budget', align: 'right' as const, render: (p) => (
              <span className="text-sm text-gray-900">{p.budget.currency} {p.budget.amount.toLocaleString()}</span>
            )
          },
          { key: 'completionPercentage', header: 'Complete', align: 'right' as const, render: (p) => <span className="text-sm text-gray-700">{p.completionPercentage}%</span> },
          {
            key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} />,
          },
        ];
        return projects.length === 0
          ? <EmptyState title="No projects" description="No projects have been created yet." />
          : <DataTable<Project> columns={projectColumns} data={projects} keyExtractor={(p) => p.id} />;
      })()}
    </div>
  );
}
