"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search } from "lucide-react";
import { LoadingSpinner, EmptyState } from "@erp/ui";
import { api, type Vendor } from "../../lib/api";

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.vendors.list();
      setVendors(res.data);
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = vendors.filter((v) =>
    !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.code.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-sm text-gray-500 mt-1">{vendors.length} vendors</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-accent-600 text-white text-sm font-medium rounded-lg hover:bg-accent-700">
          <Plus className="w-4 h-4" />
          New Vendor
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search vendors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:border-accent-300 focus:ring-2 focus:ring-accent-100 focus:outline-none"
        />
      </div>

      {loading && <LoadingSpinner />}
      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState title="No vendors found" description="Try adjusting your search." />
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Terms</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">{v.code}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{v.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{v.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{v.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{v.paymentTerms}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${v.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                        {v.isActive ? "Active" : "Inactive"}
                      </span>
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
