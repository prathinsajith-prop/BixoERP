"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search } from "lucide-react";
import { LoadingSpinner, EmptyState } from "@erp/ui";
import { api, type InventoryItem } from "../../lib/api";

export default function InventoryItemsPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.items.list();
      setItems(res.data);
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load items");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter((i) =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Items</h1>
          <p className="text-sm text-gray-500 mt-1">{items.length} items</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-accent-600 text-white text-sm font-medium rounded-lg hover:bg-accent-700">
          <Plus className="w-4 h-4" />
          New Item
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or SKU..."
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
            <EmptyState title="No items found" description="Try adjusting your search." />
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">UOM</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Selling Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">{item.sku}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.categoryName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.unitOfMeasure}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      {item.costPrice.currency} {item.costPrice.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      {item.sellingPrice.currency} {item.sellingPrice.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${item.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                        {item.isActive ? "Active" : "Inactive"}
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
