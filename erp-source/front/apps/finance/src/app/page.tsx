import { Banknote, TrendingUp, ArrowDownRight, ArrowUpRight, BookOpen } from "lucide-react";

const kpis = [
  { title: "Total Assets", value: "$4,285,400", change: 3.2, trend: "up" },
  { title: "Total Liabilities", value: "$1,892,100", change: -1.5, trend: "down" },
  { title: "Net Income (MTD)", value: "$342,800", change: 8.7, trend: "up" },
  { title: "Cash Position", value: "$1,124,300", change: 5.4, trend: "up" },
];

const recentJournals = [
  { id: "JE-2024-1205", date: "2024-03-15", description: "Monthly depreciation", debit: "$12,400", credit: "$12,400", status: "posted" },
  { id: "JE-2024-1204", date: "2024-03-15", description: "Payroll accrual", debit: "$85,200", credit: "$85,200", status: "posted" },
  { id: "JE-2024-1203", date: "2024-03-14", description: "Revenue recognition", debit: "$145,000", credit: "$145,000", status: "pending" },
  { id: "JE-2024-1202", date: "2024-03-14", description: "Prepaid insurance", debit: "$3,600", credit: "$3,600", status: "posted" },
];

const budgetSummary = [
  { name: "Operating Expenses", budget: 450000, actual: 412000 },
  { name: "Marketing", budget: 120000, actual: 134400 },
  { name: "R&D", budget: 280000, actual: 245000 },
  { name: "Administrative", budget: 95000, actual: 88200 },
];

export default function FinanceDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">General Ledger overview and financial KPIs</p>
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
              <span className={`text-sm font-medium ${kpi.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                {Math.abs(kpi.change)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Journal Entries</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entry</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentJournals.map((j) => (
                <tr key={j.id}>
                  <td className="px-4 py-3 text-sm font-medium text-blue-600">{j.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{j.description}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">{j.debit}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${j.status === "posted" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                      {j.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Budget vs Actual</h2>
          </div>
          <div className="p-6 space-y-5">
            {budgetSummary.map((b) => {
              const pct = Math.round((b.actual / b.budget) * 100);
              const over = b.actual > b.budget;
              return (
                <div key={b.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{b.name}</span>
                    <span className={over ? "text-red-600 font-medium" : "text-gray-500"}>
                      {pct}% — ${(b.actual / 1000).toFixed(0)}k / ${(b.budget / 1000).toFixed(0)}k
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${over ? "bg-red-500" : "bg-blue-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
