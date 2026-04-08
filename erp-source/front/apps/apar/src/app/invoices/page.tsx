"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { Alert, DataTable, LoadingSpinner, EmptyState, PageHeader, StatusBadge, ActionButtons, type ActionButtonItem, type TableColumn } from "@erp/ui";
import { api, type Invoice } from "../../lib/api";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.invoices.list();
      setInvoices(res.data);
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pageActions: ActionButtonItem[] = [
    { key: "create", label: "New Invoice", icon: <Plus className="h-3.5 w-3.5" />, variant: "primary", size: "sm", onClick: () => { } },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description={`${invoices.length} invoices`}
        actions={<ActionButtons actions={pageActions} />}
      />

      {loading && <LoadingSpinner />}
      {error && <Alert variant="error">{error}</Alert>}

      {!loading && !error && (() => {
        const invoiceColumns: TableColumn<Invoice>[] = [
          { key: 'invoiceNumber', header: 'Invoice #', render: (inv) => <span className="text-sm font-medium text-accent-600">{inv.invoiceNumber}</span> },
          {
            key: 'type', header: 'Type', render: (inv) => <StatusBadge status={inv.type} />,
          },
          { key: 'contactName', header: 'Contact', render: (inv) => <span className="text-sm text-gray-900">{inv.contactName}</span> },
          { key: 'issueDate', header: 'Issue Date', render: (inv) => <span className="text-sm text-gray-500">{inv.issueDate}</span> },
          { key: 'dueDate', header: 'Due Date', render: (inv) => <span className="text-sm text-gray-500">{inv.dueDate}</span> },
          {
            key: 'totalAmount', header: 'Total', align: 'right' as const, render: (inv) => (
              <span className="text-sm text-gray-900">{inv.totalAmount.currency} {inv.totalAmount.amount.toLocaleString()}</span>
            )
          },
          {
            key: 'amountDue', header: 'Due', align: 'right' as const, render: (inv) => (
              <span className="text-sm font-medium text-gray-900">{inv.amountDue.currency} {inv.amountDue.amount.toLocaleString()}</span>
            )
          },
          {
            key: 'status', header: 'Status', render: (inv) => <StatusBadge status={inv.status} />,
          },
        ];
        return invoices.length === 0
          ? <EmptyState title="No invoices" description="No invoices have been created yet." />
          : <DataTable<Invoice> columns={invoiceColumns} data={invoices} keyExtractor={(inv) => inv.id} />;
      })()}
    </div>
  );
}
