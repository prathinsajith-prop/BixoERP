"use client";

import { useEffect, useState, useCallback } from "react";
import { LoadingSpinner, EmptyState } from "@erp/ui";
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fiscal Periods</h1>
        <p className="text-sm text-gray-500 mt-1">Manage accounting periods</p>
      </div>

      {loading && <LoadingSpinner />}
      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {periods.length === 0 ? (
            <EmptyState title="No fiscal periods" description="No periods have been created yet." />
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {periods.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.startDate}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.endDate}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.status === "hard-closed" ? "bg-gray-100 text-gray-800" :
                          p.status === "open" ? "bg-green-100 text-green-800" :
                            "bg-blue-100 text-blue-800"
                        }`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(p.status === "open" || p.status === "soft-closed") && (
                        <button className="text-sm text-red-600 hover:text-red-700 font-medium">Close Period</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
