import { ArrowUpRight, ArrowDownRight } from "lucide-react";

const kpis = [
  { title: "Open POs", value: "43", change: -8.1, trend: "down" },
  { title: "Pending Value", value: "$312,400", change: 12.3, trend: "up" },
  { title: "Active Vendors", value: "67", change: 3.1, trend: "up" },
  { title: "Avg Lead Time", value: "8.2 days", change: -15.4, trend: "down" },
];

const recentPOs = [
  { num: "PO-2024-0161", vendor: "Raw Materials Ltd", date: "2024-03-15", total: "$28,600", items: 8, status: "pending_approval" },
  { num: "PO-2024-0160", vendor: "Office Supply Co", date: "2024-03-14", total: "$3,200", items: 12, status: "approved" },
  { num: "PO-2024-0159", vendor: "Equipment Leasing", date: "2024-03-13", total: "$45,000", items: 2, status: "ordered" },
  { num: "PO-2024-0158", vendor: "Tech Components Inc", date: "2024-03-12", total: "$18,400", items: 6, status: "received" },
  { num: "PO-2024-0157", vendor: "Packaging Solutions", date: "2024-03-11", total: "$5,800", items: 4, status: "received" },
];

export default function ProcurementDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Procurement Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Purchase orders & supplier management</p>
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
          <h2 className="text-lg font-semibold text-gray-900">Recent Purchase Orders</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO #</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Items</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recentPOs.map((po) => (
              <tr key={po.num} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3 text-sm font-medium text-blue-600">{po.num}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{po.vendor}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{po.date}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-700">{po.items}</td>
                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{po.total}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    po.status === "received" ? "bg-green-100 text-green-800" :
                    po.status === "ordered" ? "bg-blue-100 text-blue-800" :
                    po.status === "approved" ? "bg-cyan-100 text-cyan-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}>{po.status.replace("_", " ")}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
