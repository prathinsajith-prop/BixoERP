"use client";

import { Plus } from "lucide-react";
import { DataTable, PageHeader, StatusBadge, ActionButtons, type ActionButtonItem, type TableColumn } from "@erp/ui";

type Quote = { id: string; date: string; customer: string; validUntil: string; items: number; total: string; status: string };

const quoteColumns: TableColumn<Quote>[] = [
  { key: 'id', header: 'Quote #', render: (q) => <span className="text-sm font-medium text-blue-600">{q.id}</span> },
  { key: 'customer', header: 'Customer', render: (q) => <span className="text-sm text-gray-900">{q.customer}</span> },
  { key: 'date', header: 'Date', render: (q) => <span className="text-sm text-gray-500">{q.date}</span> },
  { key: 'validUntil', header: 'Valid Until', render: (q) => <span className="text-sm text-gray-500">{q.validUntil}</span> },
  { key: 'items', header: 'Items', align: 'right' as const, render: (q) => <span className="text-sm text-gray-700">{q.items}</span> },
  { key: 'total', header: 'Total', align: 'right' as const, render: (q) => <span className="text-sm font-medium text-gray-900">{q.total}</span> },
  {
    key: 'status', header: 'Status', render: (q) => <StatusBadge status={q.status} />,
  },
];

const quotes = [
  { id: "SQ-2024-0102", date: "2024-03-15", customer: "Acme Corp", validUntil: "2024-04-14", items: 5, total: "$24,800", status: "sent" },
  { id: "SQ-2024-0101", date: "2024-03-14", customer: "TechStart Inc", validUntil: "2024-04-13", items: 3, total: "$15,500", status: "draft" },
  { id: "SQ-2024-0100", date: "2024-03-12", customer: "Global Industries", validUntil: "2024-04-11", items: 8, total: "$72,000", status: "accepted" },
  { id: "SQ-2024-0099", date: "2024-03-10", customer: "Summit Corp", validUntil: "2024-04-09", items: 2, total: "$6,800", status: "sent" },
  { id: "SQ-2024-0098", date: "2024-03-08", customer: "NextGen Solutions", validUntil: "2024-04-07", items: 6, total: "$45,200", status: "expired" },
  { id: "SQ-2024-0097", date: "2024-03-05", customer: "Vertex Group", validUntil: "2024-04-04", items: 4, total: "$18,400", status: "rejected" },
];

const pageActions: ActionButtonItem[] = [
  { key: "create", label: "New Quote", icon: <Plus className="h-3.5 w-3.5" />, variant: "primary", size: "sm", onClick: () => { } },
];

export default function QuotesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Quotes"
        description="Manage proposals and quotations"
        actions={<ActionButtons actions={pageActions} />}
      />

      <DataTable<Quote> columns={quoteColumns} data={quotes} keyExtractor={(q) => q.id} />
    </div>
  );
}
