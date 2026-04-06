"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { DataTable, LoadingSpinner, EmptyState, PageHeader, StatusBadge, ActionButtons, type ActionButtonItem, type TableColumn } from "@erp/ui";
import { api, type PurchaseOrder } from "../../lib/api";

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.orders.list();
      setOrders(res.data);
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pageActions: ActionButtonItem[] = [
    { key: "create", label: "New Order", icon: <Plus className="h-3.5 w-3.5" />, variant: "primary", size: "sm", onClick: () => { } },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        description={`${orders.length} orders`}
        actions={<ActionButtons actions={pageActions} />}
      />

      {loading && <LoadingSpinner />}
      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {!loading && !error && (() => {
        const poColumns: TableColumn<PurchaseOrder>[] = [
          { key: 'poNumber', header: 'PO #', render: (o) => <span className="text-sm font-medium text-accent-600">{o.poNumber}</span> },
          { key: 'vendorName', header: 'Vendor', render: (o) => <span className="text-sm text-gray-900">{o.vendorName}</span> },
          { key: 'orderDate', header: 'Order Date', render: (o) => <span className="text-sm text-gray-500">{o.orderDate}</span> },
          { key: 'expectedDate', header: 'Expected', render: (o) => <span className="text-sm text-gray-500">{o.expectedDate ?? '—'}</span> },
          {
            key: 'totalAmount', header: 'Total', align: 'right' as const, render: (o) => (
              <span className="text-sm font-medium text-gray-900">{o.totalAmount.currency} {o.totalAmount.amount.toLocaleString()}</span>
            )
          },
          {
            key: 'status', header: 'Status', render: (o) => <StatusBadge status={o.status} />,
          },
        ];
        return orders.length === 0
          ? <EmptyState title="No purchase orders" description="No orders have been created yet." />
          : <DataTable<PurchaseOrder> columns={poColumns} data={orders} keyExtractor={(o) => o.id} />;
      })()}
    </div>
  );
}
