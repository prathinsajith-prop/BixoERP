"use client";

import { useEffect, useState, useCallback } from "react";
import { DataTable, LoadingSpinner, PageHeader, KPICard, StatusBadge, PageErrorState, type TableColumn } from "@erp/ui";
import { api } from "../lib/api";

type RecentJournal = { entryNumber: string; description: string; debit: number; currency: string; status: string };

export default function FinanceDashboardPage() {
  const [stats, setStats] = useState({ accounts: 0, openJournals: 0, openPeriods: 0, budgets: 0 });
  const [recentJournals, setRecentJournals] = useState<RecentJournal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [accRes, jrnRes, perRes, budRes] = await Promise.all([
        api.accounts.list(),
        api.journals.list(),
        api.periods.list(),
        api.budgets.list(),
      ]);
      setStats({
        accounts: accRes.total,
        openJournals: jrnRes.data.filter((j) => j.status === "draft").length,
        openPeriods: perRes.data.filter((p) => p.status === "open").length,
        budgets: budRes.total,
      });
      setRecentJournals(
        jrnRes.data.slice(0, 5).map((j) => ({
          entryNumber: j.entryNumber,
          description: j.description,
          debit: j.lines.reduce((s, l) => s + l.debit, 0),
          currency: "USD",
          status: j.status,
        }))
      );
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner />;
  if (error) return <PageErrorState error={error} onRetry={load} />;

  const kpis = [
    { title: "Total Accounts", value: stats.accounts.toString(), trend: "up" },
    { title: "Open Journals", value: stats.openJournals.toString(), trend: stats.openJournals > 0 ? "up" : "down" },
    { title: "Open Periods", value: stats.openPeriods.toString(), trend: "up" },
    { title: "Total Budgets", value: stats.budgets.toString(), trend: "up" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Finance Dashboard" description="General Ledger overview and financial KPIs" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <KPICard key={k.title} title={k.title} value={String(k.value)} trend={k.trend as "up" | "down"} />
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Journal Entries</h2>
        </div>
        {(() => {
          const recentJournalColumns: TableColumn<RecentJournal>[] = [
            { key: 'entryNumber', header: 'Entry', render: (j) => <span className="text-sm font-medium text-accent-600">{j.entryNumber}</span> },
            { key: 'description', header: 'Description', render: (j) => <span className="text-sm text-gray-700">{j.description}</span> },
            {
              key: 'debit', header: 'Debit', align: 'right' as const, render: (j) => (
                <span className="text-sm text-gray-900">{j.debit.toLocaleString('en-US', { style: 'currency', currency: j.currency })}</span>
              )
            },
            {
              key: 'status', header: 'Status', render: (j) => (
                <StatusBadge status={j.status} />
              )
            },
          ];
          return <DataTable<RecentJournal> columns={recentJournalColumns} data={recentJournals} keyExtractor={(j) => j.entryNumber} />;
        })()}
      </div>
    </div>
  );
}
