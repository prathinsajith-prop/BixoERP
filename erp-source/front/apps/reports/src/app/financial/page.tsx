"use client";

import { DataTable, PageHeader, type TableColumn } from "@erp/ui";

type FinancialReport = { name: string; desc: string; frequency: string; lastRun: string; format: string };

const reportColumns: TableColumn<FinancialReport>[] = [
  { key: 'name', header: 'Report', render: (r) => <div><p className="text-sm font-medium text-gray-900">{r.name}</p><p className="text-xs text-gray-500">{r.desc}</p></div> },
  { key: 'frequency', header: 'Frequency', render: (r) => <span className="text-sm text-gray-700">{r.frequency}</span> },
  { key: 'lastRun', header: 'Last Run', render: (r) => <span className="text-sm text-gray-500">{r.lastRun}</span> },
  { key: 'format', header: 'Formats', render: (r) => <span className="text-sm text-gray-500">{r.format}</span> },
  { key: 'actions', header: 'Actions', align: 'right' as const, render: () => <span><button className="text-sm text-blue-600 hover:text-blue-800 font-medium mr-3">Run</button><button className="text-sm text-gray-500 hover:text-gray-700">Schedule</button></span> },
];

const financialReports: FinancialReport[] = [
  { name: "Income Statement", desc: "Revenue, expenses & net income for a period", frequency: "Monthly", lastRun: "2024-03-01", format: "PDF, Excel" },
  { name: "Balance Sheet", desc: "Assets, liabilities & equity at a point in time", frequency: "Monthly", lastRun: "2024-03-01", format: "PDF, Excel" },
  { name: "Cash Flow Statement", desc: "Operating, investing & financing cash flows", frequency: "Monthly", lastRun: "2024-03-01", format: "PDF" },
  { name: "Trial Balance", desc: "Debit and credit totals for all accounts", frequency: "On Demand", lastRun: "2024-03-10", format: "PDF, Excel" },
  { name: "General Ledger", desc: "All transactions for selected accounts", frequency: "On Demand", lastRun: "2024-03-08", format: "PDF, Excel, CSV" },
  { name: "Aged Receivables", desc: "Outstanding AR by aging bucket", frequency: "Weekly", lastRun: "2024-03-11", format: "PDF, Excel" },
  { name: "Aged Payables", desc: "Outstanding AP by aging bucket", frequency: "Weekly", lastRun: "2024-03-11", format: "PDF, Excel" },
  { name: "Budget vs Actual", desc: "Compare actual figures to budgeted amounts", frequency: "Monthly", lastRun: "2024-03-01", format: "PDF, Excel" },
];

export default function FinancialReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Financial Reports" description="Standard financial statements & accounting reports" />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <DataTable<FinancialReport> columns={reportColumns} data={financialReports} keyExtractor={(r) => r.name} />
      </div>
    </div>
  );
}
