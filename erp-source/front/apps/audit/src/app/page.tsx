"use client";

import { useEffect, useState, useCallback } from "react";
import { Search } from "lucide-react";
import { DataTable, LoadingSpinner, EmptyState, PageHeader, StatusBadge, type TableColumn } from "@erp/ui";
import { api, type AuditLogEntry } from "../lib/api";

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.logs.list();
      setLogs(res.data);
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = logs.filter((l) =>
    !search ||
    l.userName.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.entityType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Log" description="System activity and change history" />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search logs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:border-accent-300 focus:ring-2 focus:ring-accent-100 focus:outline-none"
        />
      </div>

      {loading && <LoadingSpinner />}
      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {!loading && !error && (() => {
        const auditColumns: TableColumn<AuditLogEntry>[] = [
          { key: 'timestamp', header: 'Timestamp', render: (l) => <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</span> },
          { key: 'userName', header: 'User', render: (l) => <span className="text-sm text-gray-900">{l.userName}</span> },
          { key: 'service', header: 'Service', render: (l) => <span className="text-sm text-gray-500">{l.service}</span> },
          { key: 'action', header: 'Action', render: (l) => <StatusBadge status={l.action.toLowerCase()} label={l.action} />, },
          { key: 'entityType', header: 'Entity', render: (l) => <span className="text-sm text-gray-500">{l.entityType} #{l.entityId}</span> },
          { key: 'ipAddress', header: 'IP', render: (l) => <span className="text-xs font-mono text-gray-400">{l.ipAddress}</span> },
        ];
        return filtered.length === 0
          ? <EmptyState title="No logs found" description="Try adjusting your search." />
          : <DataTable<AuditLogEntry> columns={auditColumns} data={filtered} keyExtractor={(l) => l.id} />;
      })()}
    </div>
  );
}
