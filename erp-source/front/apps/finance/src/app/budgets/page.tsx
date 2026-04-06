"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { LoadingSpinner, EmptyState, PageHeader, ActionButtons, type ActionButtonItem } from "@erp/ui";
import { api, type Budget } from "../../lib/api";

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.budgets.list();
      setBudgets(res.data);
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load budgets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pageActions: ActionButtonItem[] = [
    { key: "create", label: "New Budget", icon: <Plus className="h-3.5 w-3.5" />, variant: "primary", size: "sm", onClick: () => { } },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budgets"
        description="Track budget allocation and spending"
        actions={<ActionButtons actions={pageActions} />}
      />

      {loading && <LoadingSpinner />}
      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        budgets.length === 0 ? (
          <EmptyState title="No budgets" description="No budgets have been created yet." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.map((b) => {
              const total = b.totalAmount.amount;
              const spent = b.lines.reduce((s, l) => s + l.actualAmount.amount, 0);
              const pct = total > 0 ? Math.round((spent / total) * 100) : 0;
              const over = spent > total;
              return (
                <div key={b.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{b.name}</h3>
                      <p className="text-xs text-gray-500">FY {b.fiscalYear}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${over ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                      {over ? "Over Budget" : "On Track"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Spent: {b.totalAmount.currency} {spent.toLocaleString()}</span>
                    <span className="text-gray-500">of {b.totalAmount.currency} {total.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${over ? "bg-red-500" : pct > 80 ? "bg-yellow-500" : "bg-accent-500"}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{pct}% utilized</p>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
