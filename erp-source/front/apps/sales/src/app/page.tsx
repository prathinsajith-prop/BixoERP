"use client";

import { useEffect, useState, useCallback } from "react";
import { LoadingSpinner } from "@erp/ui";
import { api } from "../lib/api";

export default function SalesDashboardPage() {
  const [stats, setStats] = useState({ orders: 0, customers: 0, confirmed: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [ordRes, custRes] = await Promise.all([api.orders.list(), api.customers.list()]);
      setStats({
        orders: ordRes.total,
        customers: custRes.total,
        confirmed: ordRes.data.filter((o) => o.status === "confirmed" || o.status === "shipped" || o.status === "delivered").length,
        pending: ordRes.data.filter((o) => o.status === "draft").length,
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
    { title: "Total Orders", value: stats.orders },
    { title: "Total Customers", value: stats.customers },
    { title: "Confirmed Orders", value: stats.confirmed },
    { title: "Pending Orders", value: stats.pending },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Orders and customer overview</p>
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
