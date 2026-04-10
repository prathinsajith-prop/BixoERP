"use client";

import { useEffect, useState, useCallback } from "react";
import { Alert, DataTable, LoadingSpinner, EmptyState, PageHeader, StatusBadge, type TableColumn } from "@erp/ui";
import { api, type FiscalPeriod } from "../../lib/api";

export default function FiscalPeriodsPage() {
  const [periods, setPeriods] = useState<FiscalPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.periods.list();
      setPeriods(res.data);
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load fiscal periods");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader title="Fiscal Periods" description="Manage accounting periods" />

      {loading && <LoadingSpinner />}
      {error && <Alert variant="error">{error}</Alert>}

      {!loading && !error && (() => {
        const periodColumns: TableColumn<FiscalPeriod>[] = [
          { key: 'name', header: 'Period', render: (p) => <span className="text-sm font-medium text-gray-900">{p.name}</span> },
          { key: 'startDate', header: 'Start', render: (p) => <span className="text-sm text-gray-500">{p.startDate}</span> },
          { key: 'endDate', header: 'End', render: (p) => <span className="text-sm text-gray-500">{p.endDate}</span> },
          {
            key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} />,
          },
          {
            key: 'actions', header: '', align: 'right' as const, render: (p) => (
              (p.status === 'open' || p.status === 'soft-closed') ? (
                <button className="text-sm text-red-600 hover:text-red-700 font-medium">Close Period</button>
              ) : null
            )
          },
        ];
        return periods.length === 0
          ? <EmptyState title="No fiscal periods" description="No periods have been created yet." />
          : <DataTable<FiscalPeriod> columns={periodColumns} data={periods} keyExtractor={(p) => p.id} />;
      })()}
    </div>
  );
}
