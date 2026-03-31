import { Plus } from "lucide-react";

const budgets = [
  { id: 1, name: "Operating Budget 2024", period: "FY 2024", total: "$4,500,000", spent: "$1,820,000", pct: 40, status: "active" },
  { id: 2, name: "Marketing Budget Q1", period: "Q1 2024", total: "$120,000", spent: "$134,400", pct: 112, status: "over" },
  { id: 3, name: "R&D Budget 2024", period: "FY 2024", total: "$1,200,000", spent: "$245,000", pct: 20, status: "active" },
  { id: 4, name: "Capital Expenditure", period: "FY 2024", total: "$800,000", spent: "$310,000", pct: 39, status: "active" },
  { id: 5, name: "Training & Development", period: "FY 2024", total: "$95,000", spent: "$42,000", pct: 44, status: "active" },
];

export default function BudgetsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
          <p className="text-sm text-gray-500 mt-1">Track budget allocation and spending</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          New Budget
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.map((b) => (
          <div key={b.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{b.name}</h3>
                <p className="text-xs text-gray-500">{b.period}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.status === "over" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                {b.status === "over" ? "Over Budget" : "On Track"}
              </span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Spent: {b.spent}</span>
              <span className="text-gray-500">of {b.total}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${b.pct > 100 ? "bg-red-500" : b.pct > 80 ? "bg-yellow-500" : "bg-blue-500"}`}
                style={{ width: `${Math.min(b.pct, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{b.pct}% utilized</p>
          </div>
        ))}
      </div>
    </div>
  );
}
