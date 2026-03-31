import { ArrowUpRight, ArrowDownRight, TrendingUp, ShoppingCart, Users, FileText } from "lucide-react";

const kpis = [
  { title: "Revenue (MTD)", value: "$847,320", change: 18.3, trend: "up" },
  { title: "Orders (MTD)", value: "156", change: 12.1, trend: "up" },
  { title: "Active Customers", value: "89", change: 4.7, trend: "up" },
  { title: "Pending Quotes", value: "23", change: -8.0, trend: "down" },
];

const recentOrders = [
  { num: "SO-2024-0443", customer: "Acme Corp", date: "2024-03-15", status: "confirmed", total: "$12,400" },
  { num: "SO-2024-0442", customer: "TechStart Inc", date: "2024-03-14", status: "processing", total: "$8,750" },
  { num: "SO-2024-0441", customer: "Global Industries", date: "2024-03-14", status: "shipped", total: "$45,200" },
  { num: "SO-2024-0440", customer: "Smith & Partners", date: "2024-03-13", status: "delivered", total: "$18,900" },
  { num: "SO-2024-0439", customer: "NextGen Solutions", date: "2024-03-12", status: "confirmed", total: "$31,500" },
];

export default function SalesDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Revenue, orders & pipeline overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{kpi.value}</p>
            <div className="flex items-center gap-1 mt-1">
              {kpi.trend === "up" ? <ArrowUpRight className="w-4 h-4 text-green-500" /> : <ArrowDownRight className="w-4 h-4 text-red-500" />}
              <span className={`text-sm font-medium ${kpi.trend === "up" ? "text-green-600" : "text-red-600"}`}>{Math.abs(kpi.change)}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Sales Orders</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recentOrders.map((o) => (
              <tr key={o.num} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3 text-sm font-medium text-blue-600">{o.num}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{o.customer}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{o.date}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    o.status === "delivered" ? "bg-green-100 text-green-800" :
                    o.status === "shipped" ? "bg-blue-100 text-blue-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}>{o.status}</span>
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{o.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
