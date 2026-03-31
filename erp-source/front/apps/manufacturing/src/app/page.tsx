import { ArrowUpRight, ArrowDownRight } from "lucide-react";

const kpis = [
  { title: "Active Work Orders", value: "18", change: 5.2, trend: "up" },
  { title: "Production Output", value: "1,240 units", change: 12.8, trend: "up" },
  { title: "Yield Rate", value: "96.4%", change: 1.2, trend: "up" },
  { title: "Avg Cycle Time", value: "4.6 hrs", change: -8.3, trend: "down" },
];

const activeOrders = [
  { id: "WO-2024-0082", product: "Widget Assembly A", qty: 500, completed: 340, start: "2024-03-10", due: "2024-03-20", status: "in_progress" },
  { id: "WO-2024-0081", product: "Circuit Board X12", qty: 200, completed: 200, start: "2024-03-08", due: "2024-03-18", status: "completed" },
  { id: "WO-2024-0083", product: "Housing Unit B", qty: 150, completed: 0, start: "2024-03-16", due: "2024-03-26", status: "planned" },
  { id: "WO-2024-0084", product: "Gear Assembly C", qty: 300, completed: 120, start: "2024-03-12", due: "2024-03-22", status: "in_progress" },
];

export default function ManufacturingDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manufacturing Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Production overview & work orders</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{kpi.value}</p>
            <div className="flex items-center gap-1 mt-1">
              {kpi.trend === "up" ? <ArrowUpRight className="w-4 h-4 text-green-500" /> : <ArrowDownRight className="w-4 h-4 text-green-500" />}
              <span className="text-sm font-medium text-green-600">{Math.abs(kpi.change)}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Active Work Orders</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">WO #</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {activeOrders.map((wo) => {
              const pct = Math.round((wo.completed / wo.qty) * 100);
              return (
                <tr key={wo.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3 text-sm font-medium text-blue-600">{wo.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{wo.product}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700">{wo.qty}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-medium text-gray-600">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{wo.due}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      wo.status === "completed" ? "bg-green-100 text-green-800" :
                      wo.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                      "bg-gray-100 text-gray-600"
                    }`}>{wo.status.replace(/_/g, " ")}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
