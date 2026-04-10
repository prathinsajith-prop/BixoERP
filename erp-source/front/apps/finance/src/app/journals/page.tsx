"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { Alert, DataTable, LoadingSpinner, EmptyState, PageHeader, StatusBadge, ActionButtons, type ActionButtonItem, type TableColumn } from "@erp/ui";
import { api, type JournalEntry } from "../../lib/api";

export default function JournalEntriesPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.journals.list();
      setEntries(res.data);
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load journal entries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pageActions: ActionButtonItem[] = [
    { key: "create", label: "New Entry", icon: <Plus className="h-3.5 w-3.5" />, variant: "primary", size: "sm", onClick: () => { } },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal Entries"
        description="Manual and auto-generated entries"
        actions={<ActionButtons actions={pageActions} />}
      />

      {loading && <LoadingSpinner />}
      {error && <Alert variant="error">{error}</Alert>}

      {!loading && !error && (() => {
        const journalColumns: TableColumn<JournalEntry>[] = [
          { key: 'entryNumber', header: 'Entry #', render: (e) => <span className="text-sm font-medium text-accent-600">{e.entryNumber}</span> },
          { key: 'date', header: 'Date', render: (e) => <span className="text-sm text-gray-500">{e.date}</span> },
          { key: 'description', header: 'Description', render: (e) => <span className="text-sm text-gray-900">{e.description}</span> },
          {
            key: 'debit', header: 'Debit', align: 'right' as const, render: (e) => (
              <span className="text-sm text-gray-900">{e.lines.reduce((s, l) => s + l.debit, 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
            )
          },
          {
            key: 'credit', header: 'Credit', align: 'right' as const, render: (e) => (
              <span className="text-sm text-gray-900">{e.lines.reduce((s, l) => s + l.credit, 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
            )
          },
          { key: 'lines', header: 'Lines', align: 'center' as const, render: (e) => <span className="text-sm text-gray-500">{e.lines.length}</span> },
          {
            key: 'status', header: 'Status', render: (e) => <StatusBadge status={e.status} />,
          },
        ];
        return entries.length === 0
          ? <EmptyState title="No journal entries" description="No entries have been created yet." />
          : <DataTable<JournalEntry> columns={journalColumns} data={entries} keyExtractor={(e) => e.id} />;
      })()}
    </div>
  );
}
