"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { Alert, DataTable, LoadingSpinner, EmptyState, PageHeader, StatusBadge, ActionButtons, type ActionButtonItem, type TableColumn } from "@erp/ui";
import { api, type SalesOrder } from "../../lib/api";

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.orders.list();
      setOrders(res.data);
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load sales orders");
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
        title="Sales Orders"
        description={`${orders.length} orders`}
        actions={<ActionButtons actions={pageActions} />}
      />

      {loading && <LoadingSpinner />}
      {error && <Alert variant="error">{error}</Alert>}

      {!loading && !error && (() => {
        const orderColumns: TableColumn<SalesOrder>[] = [
          { key: 'orderNumber', header: 'Order #', render: (o) => <span className="text-sm font-medium text-accent-600">{o.orderNumber}</span> },
          { key: 'customerName', header: 'Customer', render: (o) => <span className="text-sm text-gray-900">{o.customerName}</span> },
          { key: 'orderDate', header: 'Order Date', render: (o) => <span className="text-sm text-gray-500">{o.orderDate}</span> },
          { key: 'deliveryDate', header: 'Delivery Date', render: (o) => <span className="text-sm text-gray-500">{o.deliveryDate ?? '—'}</span> },
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
          ? <EmptyState title="No sales orders" description="No orders have been created yet." />
          : <DataTable<SalesOrder> columns={orderColumns} data={orders} keyExtractor={(o) => o.id} />;
      })()}
    </div>
  );
}
