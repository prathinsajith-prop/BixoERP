import { FileBarChart, FileText, PieChart, TrendingUp, DollarSign } from "lucide-react";

const reportCategories = [
  {
    title: "Financial Reports",
    icon: DollarSign,
    color: "bg-green-100 text-green-600",
    reports: [
      { name: "Income Statement", description: "Revenue, expenses & net income", type: "standard" },
      { name: "Balance Sheet", description: "Assets, liabilities & equity snapshot", type: "standard" },
      { name: "Cash Flow Statement", description: "Operating, investing & financing activities", type: "standard" },
      { name: "Trial Balance", description: "All account balances at a point in time", type: "standard" },
    ],
  },
  {
    title: "Sales & Revenue",
    icon: TrendingUp,
    color: "bg-blue-100 text-blue-600",
    reports: [
      { name: "Sales by Customer", description: "Revenue breakdown by customer", type: "standard" },
      { name: "Sales by Product", description: "Top-selling products & margins", type: "standard" },
      { name: "Pipeline Analysis", description: "Quote-to-order conversion rates", type: "custom" },
    ],
  },
  {
    title: "Operations",
    icon: PieChart,
    color: "bg-purple-100 text-purple-600",
    reports: [
      { name: "Inventory Valuation", description: "Stock value by warehouse", type: "standard" },
      { name: "Production Efficiency", description: "Yield rates & cycle times", type: "custom" },
      { name: "Procurement Spend", description: "Vendor spend analysis", type: "standard" },
    ],
  },
  {
    title: "HR & Payroll",
    icon: FileText,
    color: "bg-orange-100 text-orange-600",
    reports: [
      { name: "Headcount Report", description: "Active employees by department", type: "standard" },
      { name: "Payroll Summary", description: "Monthly payroll costs", type: "standard" },
      { name: "Leave Utilization", description: "Leave balances & usage", type: "standard" },
    ],
  },
];

export default function ReportsDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Standard & custom reports across all modules</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
          <FileBarChart className="w-6 h-6 text-blue-600 mx-auto" />
          <p className="mt-2 text-2xl font-bold text-gray-900">24</p>
          <p className="text-sm text-gray-500">Standard Reports</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
          <FileText className="w-6 h-6 text-purple-600 mx-auto" />
          <p className="mt-2 text-2xl font-bold text-gray-900">8</p>
          <p className="text-sm text-gray-500">Custom Reports</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
          <PieChart className="w-6 h-6 text-green-600 mx-auto" />
          <p className="mt-2 text-2xl font-bold text-gray-900">5</p>
          <p className="text-sm text-gray-500">Dashboards</p>
        </div>
      </div>

      {reportCategories.map((cat) => (
        <div key={cat.title} className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cat.color}`}>
              <cat.icon className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{cat.title}</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {cat.reports.map((r) => (
              <div key={r.name} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-500">{r.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.type === "custom" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>{r.type}</span>
                  <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">Run</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
