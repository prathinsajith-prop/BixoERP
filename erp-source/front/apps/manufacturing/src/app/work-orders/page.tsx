"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { DataTable, LoadingSpinner, EmptyState, PageHeader, StatusBadge, ActionButtons, type ActionButtonItem, type TableColumn } from "@erp/ui";
import { api, type WorkOrder } from "../../lib/api";

export default function WorkOrdersPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.workOrders.list();
      setOrders(res.data);
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load work orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pageActions: ActionButtonItem[] = [
    { key: "create", label: "New Work Order", icon: <Plus className="h-3.5 w-3.5" />, variant: "primary", size: "sm", onClick: () => { } },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Work Orders"
        description={`${orders.length} work orders`}
        actions={<ActionButtons actions={pageActions} />}
      />

      {loading && <LoadingSpinner />}
      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {!loading && !error && (() => {
        const woColumns: TableColumn<WorkOrder>[] = [
          { key: 'workOrderNumber', header: 'WO #', render: (o) => <span className="text-sm font-medium text-accent-600">{o.workOrderNumber}</span> },
          { key: 'productName', header: 'Product', render: (o) => <span className="text-sm text-gray-900">{o.productName}</span> },
          { key: 'quantity', header: 'Qty', align: 'right' as const, render: (o) => <span className="text-sm text-gray-700">{o.quantity}</span> },
          { key: 'completedQuantity', header: 'Completed', align: 'right' as const, render: (o) => <span className="text-sm text-gray-700">{o.completedQuantity}</span> },
          { key: 'startDate', header: 'Start', render: (o) => <span className="text-sm text-gray-500">{o.startDate}</span> },
          { key: 'dueDate', header: 'Due', render: (o) => <span className="text-sm text-gray-500">{o.dueDate}</span> },
          {
            key: 'status', header: 'Status', render: (o) => <StatusBadge status={o.status} />,
          },
        ];
        return orders.length === 0
          ? <EmptyState title="No work orders" description="No work orders created yet." />
          : <DataTable<WorkOrder> columns={woColumns} data={orders} keyExtractor={(o) => o.id} />;
      })()}
    </div>
  );
}
