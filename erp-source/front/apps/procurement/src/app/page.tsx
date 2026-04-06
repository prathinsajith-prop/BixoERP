"use client";

import { useEffect, useState, useCallback } from "react";
import { LoadingSpinner, PageHeader, KPICard } from "@erp/ui";
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
      <PageHeader title="Procurement Dashboard" description="Purchase orders and vendor overview" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <KPICard key={k.title} title={k.title} value={String(k.value)} />
        ))}
      </div>
    </div>
  );
}
