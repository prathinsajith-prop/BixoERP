"use client";

import { DataTable, PageHeader, StatusBadge, type TableColumn } from "@erp/ui";

type Receipt = { id: string; date: string; po: string; vendor: string; items: number; received: number; status: string };

const receiptColumns: TableColumn<Receipt>[] = [
  { key: 'id', header: 'Receipt #', render: (r) => <span className="text-sm font-medium text-blue-600">{r.id}</span> },
  { key: 'date', header: 'Date', render: (r) => <span className="text-sm text-gray-500">{r.date}</span> },
  { key: 'po', header: 'PO Ref', render: (r) => <span className="text-sm text-blue-600 font-mono">{r.po}</span> },
  { key: 'vendor', header: 'Vendor', render: (r) => <span className="text-sm text-gray-900">{r.vendor}</span> },
  { key: 'items', header: 'Expected', align: 'center' as const, render: (r) => <span className="text-sm text-gray-700">{r.items}</span> },
  { key: 'received', header: 'Received', align: 'center' as const, render: (r) => <span className="text-sm font-medium text-gray-900">{r.received}</span> },
  {
    key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} />,
  },
];

const receipts: Receipt[] = [
  { id: "GR-2024-0089", date: "2024-03-15", po: "PO-2024-0158", vendor: "Tech Components Inc", items: 4, received: 4, status: "complete" },
  { id: "GR-2024-0088", date: "2024-03-14", po: "PO-2024-0157", vendor: "Packaging Solutions", items: 4, received: 4, status: "complete" },
  { id: "GR-2024-0087", date: "2024-03-13", po: "PO-2024-0156", vendor: "Metal Works Co", items: 3, received: 3, status: "complete" },
  { id: "GR-2024-0086", date: "2024-03-12", po: "PO-2024-0155", vendor: "Raw Materials Ltd", items: 8, received: 5, status: "partial" },
  { id: "GR-2024-0085", date: "2024-03-10", po: "PO-2024-0153", vendor: "Tech Components Inc", items: 6, received: 6, status: "complete" },
];

export default function ReceivingPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Receiving" description="Goods receipt & 3-way matching" />

      <DataTable<Receipt> columns={receiptColumns} data={receipts} keyExtractor={(r) => r.id} />
    </div>
  );
}
