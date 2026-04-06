"use client";

import { Plus } from "lucide-react";
import { DataTable, PageHeader, StatusBadge, ActionButtons, type ActionButtonItem, type TableColumn } from "@erp/ui";

type CreditNote = { id: string; date: string; customer: string; invoice: string; reason: string; amount: string; status: string };

const cnColumns: TableColumn<CreditNote>[] = [
  { key: 'id', header: 'Credit Note #', render: (cn) => <span className="text-sm font-medium text-blue-600">{cn.id}</span> },
  { key: 'date', header: 'Date', render: (cn) => <span className="text-sm text-gray-500">{cn.date}</span> },
  { key: 'customer', header: 'Customer', render: (cn) => <span className="text-sm text-gray-900">{cn.customer}</span> },
  { key: 'invoice', header: 'Invoice', render: (cn) => <span className="text-sm text-blue-600">{cn.invoice}</span> },
  { key: 'reason', header: 'Reason', render: (cn) => <span className="text-sm text-gray-700">{cn.reason}</span> },
  { key: 'amount', header: 'Amount', align: 'right' as const, render: (cn) => <span className="text-sm font-medium text-gray-900">{cn.amount}</span> },
  {
    key: 'status', header: 'Status', render: (cn) => <StatusBadge status={cn.status} />,
  },
];

const creditNotes: CreditNote[] = [
  { id: "CN-2024-0032", date: "2024-03-14", customer: "Acme Corp", invoice: "INV-2024-0845", reason: "Returned goods", amount: "$2,400", status: "applied" },
  { id: "CN-2024-0031", date: "2024-03-10", customer: "TechStart Inc", invoice: "INV-2024-0830", reason: "Pricing error", amount: "$875", status: "applied" },
  { id: "CN-2024-0030", date: "2024-03-08", customer: "Global Industries", invoice: "INV-2024-0822", reason: "Damaged in transit", amount: "$4,200", status: "pending" },
  { id: "CN-2024-0029", date: "2024-03-05", customer: "Smith & Partners", invoice: "INV-2024-0810", reason: "Service credit", amount: "$1,500", status: "applied" },
];

const pageActions: ActionButtonItem[] = [
  { key: "create", label: "New Credit Note", icon: <Plus className="h-3.5 w-3.5" />, variant: "primary", size: "sm", onClick: () => { } },
];

export default function CreditNotesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Credit Notes"
        description="Issue and track credit notes"
        actions={<ActionButtons actions={pageActions} />}
      />

      <DataTable<CreditNote> columns={cnColumns} data={creditNotes} keyExtractor={(cn) => cn.id} />
    </div>
  );
}
