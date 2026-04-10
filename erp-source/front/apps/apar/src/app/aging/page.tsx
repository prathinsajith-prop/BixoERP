"use client";

import { DataTable, PageHeader, type TableColumn } from "@erp/ui";

type AgingRow = { customer: string; current: number; d30: number; d60: number; d90: number; over90: number; total: number };

const agingColumns: TableColumn<AgingRow>[] = [
  { key: 'customer', header: 'Customer/Vendor', render: (r) => <span className="text-sm font-medium text-gray-900">{r.customer}</span> },
  { key: 'current', header: 'Current', align: 'right' as const, render: (r) => <span className="text-sm text-gray-700">{fmt(r.current)}</span> },
  { key: 'd30', header: '1-30', align: 'right' as const, render: (r) => <span className="text-sm text-gray-700">{fmt(r.d30)}</span> },
  { key: 'd60', header: '31-60', align: 'right' as const, render: (r) => <span className="text-sm text-yellow-600">{fmt(r.d60)}</span> },
  { key: 'd90', header: '61-90', align: 'right' as const, render: (r) => <span className="text-sm text-orange-600">{fmt(r.d90)}</span> },
  { key: 'over90', header: '90+', align: 'right' as const, render: (r) => <span className="text-sm text-red-600">{fmt(r.over90)}</span> },
  { key: 'total', header: 'Total', align: 'right' as const, render: (r) => <span className="text-sm font-semibold text-gray-900">{fmt(r.total)}</span> },
];

const agingData = {
  receivable: [
    { customer: "Acme Corp", current: 12400, d30: 8200, d60: 0, d90: 0, over90: 0, total: 20600 },
    { customer: "Global Industries", current: 0, d30: 15800, d60: 22400, d90: 7000, over90: 0, total: 45200 },
    { customer: "NextGen Solutions", current: 31500, d30: 0, d60: 0, d90: 0, over90: 0, total: 31500 },
    { customer: "Summit Corp", current: 18200, d30: 12400, d60: 5600, d90: 0, over90: 0, total: 36200 },
    { customer: "Vertex Group", current: 14200, d30: 8500, d60: 0, d90: 0, over90: 0, total: 22700 },
  ],
  payable: [
    { customer: "Raw Materials Ltd", current: 28600, d30: 12400, d60: 0, d90: 0, over90: 0, total: 41000 },
    { customer: "Office Supply Co", current: 3200, d30: 1800, d60: 2400, d90: 0, over90: 0, total: 7400 },
    { customer: "Equipment Leasing", current: 5400, d30: 5400, d60: 5400, d90: 0, over90: 0, total: 16200 },
  ],
};

function fmt(n: number) {
  return n === 0 ? "—" : `$${n.toLocaleString()}`;
}

export default function AgingReportPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Aging Report" description="Outstanding balances by age bucket" />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Accounts Receivable Aging</h2>
        </div>
        <DataTable<AgingRow> columns={agingColumns} data={agingData.receivable} keyExtractor={(r) => r.customer} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Accounts Payable Aging</h2>
        </div>
        <DataTable<AgingRow> columns={agingColumns} data={agingData.payable} keyExtractor={(r) => r.customer} />
      </div>
    </div>
  );
}
