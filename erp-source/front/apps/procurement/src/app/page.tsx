"use client";

import { useEffect, useState, useCallback } from "react";
import { LoadingSpinner } from "@erp/ui";
import { api } from "../lib/api";

export default function ProcurementDashboardPage() {
  const [stats, setStats] = useState({ orders: 0, vendors: 0, pending: 0, approved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [ordRes, vendRes] = await Promise.all([api.orders.list(), api.vendors.list()]);
      setStats({
        orders: ordRes.total,
        vendors: vendRes.total,
        pending: ordRes.data.filter((o) => o.status === "submitted").length,
        approved: ordRes.data.filter((o) => o.status === "approved").length,
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
    { title: "Active Vendors", value: stats.vendors },
    { title: "Pending Approval", value: stats.pending },
    { title: "Approved", value: stats.approved },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Procurement Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Purchase orders and vendor overview</p>
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
