"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { LoadingSpinner, EmptyState } from "@erp/ui";
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Journal Entries</h1>
          <p className="text-sm text-gray-500 mt-1">Manual and auto-generated entries</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-accent-600 text-white text-sm font-medium rounded-lg hover:bg-accent-700">
          <Plus className="w-4 h-4" />
          New Entry
        </button>
      </div>

      {loading && <LoadingSpinner />}
      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {entries.length === 0 ? (
            <EmptyState title="No journal entries" description="No entries have been created yet." />
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entry #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Lines</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((e) => {
                  const debit = e.lines.reduce((s, l) => s + l.debit, 0);
                  const credit = e.lines.reduce((s, l) => s + l.credit, 0);
                  return (
                    <tr key={e.id} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-4 py-3 text-sm font-medium text-accent-600">{e.entryNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{e.date}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{e.description}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">{debit.toLocaleString("en-US", { style: "currency", currency: "USD" })}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">{credit.toLocaleString("en-US", { style: "currency", currency: "USD" })}</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-500">{e.lines.length}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          e.status === "posted" ? "bg-green-100 text-green-800" :
                          e.status === "reversed" ? "bg-red-100 text-red-800" :
                          "bg-yellow-100 text-yellow-800"
                        }`}>{e.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
