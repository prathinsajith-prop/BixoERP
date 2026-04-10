"use client";

import { DataTable, PageHeader, StatusBadge, type TableColumn } from "@erp/ui";

type TaxCode = { code: string; name: string; rate: string; type: string; status: string };
type TaxReturn = { period: string; dueDate: string; outputTax: string; inputTax: string; net: string; status: string };

const taxCodeColumns: TableColumn<TaxCode>[] = [
  { key: 'code', header: 'Code', render: (t) => <span className="text-sm font-mono text-gray-900">{t.code}</span> },
  { key: 'name', header: 'Name', render: (t) => <span className="text-sm text-gray-700">{t.name}</span> },
  { key: 'rate', header: 'Rate', align: 'center' as const, render: (t) => <span className="text-sm font-medium text-gray-900">{t.rate}</span> },
  { key: 'type', header: 'Type', render: (t) => <span className="text-sm text-gray-500">{t.type}</span> },
  {
    key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} />,
  },
];

const taxReturnColumns: TableColumn<TaxReturn>[] = [
  { key: 'period', header: 'Period', render: (r) => <span className="text-sm font-medium text-gray-900">{r.period}</span> },
  { key: 'dueDate', header: 'Due Date', render: (r) => <span className="text-sm text-gray-500">{r.dueDate}</span> },
  { key: 'outputTax', header: 'Output Tax', align: 'right' as const, render: (r) => <span className="text-sm text-gray-900">{r.outputTax}</span> },
  { key: 'inputTax', header: 'Input Tax', align: 'right' as const, render: (r) => <span className="text-sm text-gray-900">{r.inputTax}</span> },
  { key: 'net', header: 'Net Payable', align: 'right' as const, render: (r) => <span className="text-sm font-medium text-gray-900">{r.net}</span> },
  {
    key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} />,
  },
];

const taxCodes: TaxCode[] = [
  { code: "VAT-STD", name: "Standard VAT", rate: "20%", type: "Output", status: "active" },
  { code: "VAT-RED", name: "Reduced Rate VAT", rate: "5%", type: "Output", status: "active" },
  { code: "VAT-ZERO", name: "Zero Rate VAT", rate: "0%", type: "Output", status: "active" },
  { code: "VAT-EX", name: "VAT Exempt", rate: "0%", type: "Exempt", status: "active" },
  { code: "GST-10", name: "GST Standard", rate: "10%", type: "Output", status: "active" },
  { code: "WHT-15", name: "Withholding Tax", rate: "15%", type: "Input", status: "active" },
];

const taxReturns: TaxReturn[] = [
  { period: "Jan 2024", dueDate: "2024-02-28", outputTax: "$45,200", inputTax: "$28,100", net: "$17,100", status: "filed" },
  { period: "Feb 2024", dueDate: "2024-03-31", outputTax: "$52,800", inputTax: "$31,400", net: "$21,400", status: "filed" },
  { period: "Mar 2024", dueDate: "2024-04-30", outputTax: "$38,600", inputTax: "$22,900", net: "$15,700", status: "draft" },
];

export default function TaxManagementPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Tax Management" description="Tax codes, rates, and return filing" />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Tax Codes</h2>
        </div>
        <DataTable<TaxCode> columns={taxCodeColumns} data={taxCodes} keyExtractor={(t) => t.code} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Tax Returns</h2>
        </div>
        <DataTable<TaxReturn> columns={taxReturnColumns} data={taxReturns} keyExtractor={(r) => r.period} />
      </div>
    </div>
  );
}
