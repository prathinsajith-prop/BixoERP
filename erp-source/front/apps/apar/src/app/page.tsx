import { ArrowUpRight, ArrowDownRight, Clock, FileText, CreditCard, AlertTriangle } from "lucide-react";

const kpis = [
  { title: "Accounts Receivable", value: "$384,200", change: 5.2, trend: "up" },
  { title: "Accounts Payable", value: "$256,400", change: -3.1, trend: "down" },
  { title: "Overdue Invoices", value: "12", change: 15.0, trend: "up" },
  { title: "Cash Collected (MTD)", value: "$198,500", change: 22.4, trend: "up" },
];

const agingBuckets = [
  { label: "Current", ar: "$142,000", ap: "$98,200" },
  { label: "1-30 days", ar: "$95,400", ap: "$72,100" },
  { label: "31-60 days", ar: "$68,200", ap: "$45,600" },
  { label: "61-90 days", ar: "$42,100", ap: "$28,300" },
  { label: "90+ days", ar: "$36,500", ap: "$12,200" },
];

export default function AparDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AP / AR Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Payables, Receivables & Cash Flow</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{kpi.value}</p>
            <div className="flex items-center gap-1 mt-1">
              {kpi.trend === "up" ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${kpi.title.includes("Overdue") ? "text-red-600" : kpi.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                {Math.abs(kpi.change)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Aging Summary</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bucket</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Receivable</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Payable</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {agingBuckets.map((b) => (
              <tr key={b.label}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{b.label}</td>
                <td className="px-4 py-3 text-sm text-right text-blue-600 font-medium">{b.ar}</td>
                <td className="px-4 py-3 text-sm text-right text-red-600 font-medium">{b.ap}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
