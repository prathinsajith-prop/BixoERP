"use client";

import { useEffect, useState, useCallback } from "react";
import { DataTable, LoadingSpinner, EmptyState, Button, PageHeader, StatusBadge, type TableColumn } from "@erp/ui";
import { api, type PayrollRunResponse } from "../../lib/api";

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export default function PayrollPage() {
  const [runs, setRuns] = useState<PayrollRunResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setRuns(await api.payroll.list());
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load payroll runs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner />;
  if (error) return <EmptyState title="Error loading payroll" description={error} action={<Button onClick={load}>Retry</Button>} />;

  const payrollColumns: TableColumn<PayrollRunResponse>[] = [
    {
      key: 'runNumber',
      header: 'Run #',
      render: (r) => <span className="text-sm font-medium text-blue-600">{r.runNumber}</span>,
    },
    { key: 'periodLabel', header: 'Period' },
    { key: 'employeeCount', header: 'Employees', align: 'center' as const },
    {
      key: 'totalGross',
      header: 'Gross',
      align: 'right' as const,
      render: (r) => <span>{fmt(r.totalGross.amount, r.currency)}</span>,
    },
    {
      key: 'totalDeductions',
      header: 'Deductions',
      align: 'right' as const,
      render: (r) => <span className="text-red-600">{fmt(r.totalDeductions.amount, r.currency)}</span>,
    },
    {
      key: 'totalNet',
      header: 'Net Pay',
      align: 'right' as const,
      render: (r) => <span className="font-semibold">{fmt(r.totalNet.amount, r.currency)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Payroll" description="Monthly payroll runs & history" />

      {runs.length === 0 ? (
        <EmptyState title="No payroll runs" description="No payroll has been processed yet" />
      ) : (
        <DataTable<PayrollRunResponse>
          columns={payrollColumns}
          data={runs}
          keyExtractor={(r) => r.id}
        />
      )}
    </div>
  );
}
