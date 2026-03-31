import { Plus } from "lucide-react";

const orders = [
  { num: "SO-2024-0443", customer: "Acme Corp", date: "2024-03-15", delivery: "2024-03-22", status: "confirmed", items: 5, total: "$12,400" },
  { num: "SO-2024-0442", customer: "TechStart Inc", date: "2024-03-14", delivery: "2024-03-21", status: "processing", items: 3, total: "$8,750" },
  { num: "SO-2024-0441", customer: "Global Industries", date: "2024-03-14", delivery: "2024-03-18", status: "shipped", items: 12, total: "$45,200" },
  { num: "SO-2024-0440", customer: "Smith & Partners", date: "2024-03-13", delivery: "2024-03-15", status: "delivered", items: 8, total: "$18,900" },
  { num: "SO-2024-0439", customer: "NextGen Solutions", date: "2024-03-12", delivery: "2024-03-20", status: "confirmed", items: 4, total: "$31,500" },
  { num: "SO-2024-0438", customer: "Pinnacle LLC", date: "2024-03-11", delivery: "2024-03-19", status: "draft", items: 2, total: "$6,200" },
  { num: "SO-2024-0437", customer: "Summit Corp", date: "2024-03-10", delivery: "2024-03-17", status: "cancelled", items: 1, total: "$3,100" },
];

export default function SalesOrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage customer orders</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          New Order
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Items</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((o) => (
              <tr key={o.num} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3 text-sm font-medium text-blue-600">{o.num}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{o.customer}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{o.date}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{o.delivery}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    o.status === "delivered" ? "bg-green-100 text-green-800" :
                    o.status === "shipped" ? "bg-blue-100 text-blue-800" :
                    o.status === "cancelled" ? "bg-red-100 text-red-800" :
                    o.status === "draft" ? "bg-gray-100 text-gray-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}>{o.status}</span>
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-700">{o.items}</td>
                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{o.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
