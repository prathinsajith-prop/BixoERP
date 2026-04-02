"use client";

import { useEffect, useState, useCallback } from "react";
import { LoadingSpinner } from "@erp/ui";
import { api } from "../lib/api";

export default function AparDashboardPage() {
  const [stats, setStats] = useState({ invoices: 0, payments: 0, receivable: 0, payable: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [invRes, payRes] = await Promise.all([api.invoices.list(), api.payments.list()]);
      setStats({
        invoices: invRes.total,
        payments: payRes.total,
        receivable: invRes.data.filter((i) => i.type === "receivable" && i.status !== "paid" && i.status !== "void").length,
        payable: invRes.data.filter((i) => i.type === "payable" && i.status !== "paid" && i.status !== "void").length,
      });
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-6 text-sm text-red-600">{error}</div>;

  const kpis = [
    { title: "Total Invoices", value: stats.invoices },
    { title: "Total Payments", value: stats.payments },
    { title: "Open Receivables", value: stats.receivable },
    { title: "Open Payables", value: stats.payable },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AP/AR Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Accounts payable and receivable overview</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.title} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm font-medium text-gray-500">{k.title}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{k.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
