"use client";

import { useEffect, useState, useCallback } from "react";
import { Alert, DataTable, LoadingSpinner, EmptyState, PageHeader, StatusBadge, type TableColumn } from "@erp/ui";
import { api, type ApprovalRequest } from "../../lib/api";

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.approvals.list();
      setRequests(res.data);
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load approval requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader title="My Requests" description={`${requests.length} requests`} />

      {loading && <LoadingSpinner />}
      {error && <Alert variant="error">{error}</Alert>}

      {!loading && !error && (() => {
        const requestColumns: TableColumn<ApprovalRequest>[] = [
          { key: 'workflowName', header: 'Workflow', render: (r) => <span className="text-sm font-medium text-gray-900">{r.workflowName}</span> },
          { key: 'entityType', header: 'Entity', render: (r) => <span className="text-sm text-gray-500">{r.entityType} #{r.entityId}</span> },
          { key: 'requesterName', header: 'Requester', render: (r) => <span className="text-sm text-gray-700">{r.requesterName}</span> },
          { key: 'currentApproverName', header: 'Current Approver', render: (r) => <span className="text-sm text-gray-500">{r.currentApproverName ?? '—'}</span> },
          { key: 'steps', header: 'Steps', align: 'center' as const, render: (r) => <span className="text-sm text-gray-700">{r.steps.length}</span> },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
        ];
        return requests.length === 0
          ? <EmptyState title="No requests" description="No approval requests found." />
          : <DataTable<ApprovalRequest> columns={requestColumns} data={requests} keyExtractor={(r) => r.id} />;
      })()}
    </div>
  );
}
