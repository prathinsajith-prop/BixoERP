"use client";

import { useEffect, useState, useCallback } from "react";
import { LoadingSpinner, EmptyState, Button } from "@erp/ui";
import { api, type PayrollRunResponse } from "../../lib/api";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  CALCULATED: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
  PROCESSED: "bg-emerald-100 text-emerald-800",
  PAID: "bg-green-100 text-green-800",
};

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payroll</h1>
        <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Monthly payroll runs & history</p>
      </div>

      {runs.length === 0 ? (
        <EmptyState title="No payroll runs" description="No payroll has been processed yet" />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-x-auto max-w-full dark:bg-gray-800 dark:ring-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Run #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Employees</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gross</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deductions</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Pay</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {runs.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm font-medium text-blue-600">{r.runNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{r.periodLabel}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-700 dark:text-gray-300">{r.employeeCount}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">{fmt(r.totalGross.amount, r.currency)}</td>
                  <td className="px-4 py-3 text-sm text-right text-red-600">{fmt(r.totalDeductions.amount, r.currency)}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-white">{fmt(r.totalNet.amount, r.currency)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusStyles[r.status] ?? "bg-gray-100 text-gray-800"}`}>
                      {r.status.toLowerCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
