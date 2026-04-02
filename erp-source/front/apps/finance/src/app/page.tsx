"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { LoadingSpinner } from "@erp/ui";
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
  if (error) return <div className="p-6 text-sm text-red-600">{error}</div>;

  const kpis = [
    { title: "Total Accounts", value: stats.accounts.toString(), trend: "up" },
    { title: "Open Journals", value: stats.openJournals.toString(), trend: stats.openJournals > 0 ? "up" : "down" },
    { title: "Open Periods", value: stats.openPeriods.toString(), trend: "up" },
    { title: "Total Budgets", value: stats.budgets.toString(), trend: "up" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">General Ledger overview and financial KPIs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{kpi.value}</p>
            <div className="flex items-center gap-1 mt-1">
              {kpi.trend === "up" ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Journal Entries</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entry</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recentJournals.map((j) => (
              <tr key={j.entryNumber}>
                <td className="px-4 py-3 text-sm font-medium text-accent-600">{j.entryNumber}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{j.description}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{j.debit.toLocaleString("en-US", { style: "currency", currency: j.currency })}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${j.status === "posted" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {j.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
