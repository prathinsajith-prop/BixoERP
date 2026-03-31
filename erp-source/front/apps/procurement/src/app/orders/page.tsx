import { Plus } from "lucide-react";

const purchaseOrders = [
  { num: "PO-2024-0161", vendor: "Raw Materials Ltd", date: "2024-03-15", expected: "2024-03-25", total: "$28,600", lines: 8, status: "pending_approval" },
  { num: "PO-2024-0160", vendor: "Office Supply Co", date: "2024-03-14", expected: "2024-03-20", total: "$3,200", lines: 12, status: "approved" },
  { num: "PO-2024-0159", vendor: "Equipment Leasing", date: "2024-03-13", expected: "2024-04-05", total: "$45,000", lines: 2, status: "ordered" },
  { num: "PO-2024-0158", vendor: "Tech Components Inc", date: "2024-03-12", expected: "2024-03-18", total: "$18,400", lines: 6, status: "partially_received" },
  { num: "PO-2024-0157", vendor: "Packaging Solutions", date: "2024-03-11", expected: "2024-03-15", total: "$5,800", lines: 4, status: "received" },
  { num: "PO-2024-0156", vendor: "Metal Works Co", date: "2024-03-10", expected: "2024-03-14", total: "$12,400", lines: 3, status: "received" },
];

export default function PurchaseOrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage procurement orders</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> New Purchase Order
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO #</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Lines</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {purchaseOrders.map((po) => (
              <tr key={po.num} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3 text-sm font-medium text-blue-600">{po.num}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{po.vendor}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{po.date}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{po.expected}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-700">{po.lines}</td>
                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{po.total}</td>
                <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  po.status === "received" ? "bg-green-100 text-green-800" :
                  po.status === "partially_received" ? "bg-blue-100 text-blue-800" :
                  po.status === "ordered" ? "bg-cyan-100 text-cyan-800" :
                  po.status === "approved" ? "bg-indigo-100 text-indigo-800" :
                  "bg-yellow-100 text-yellow-800"
                }`}>{po.status.replace(/_/g, " ")}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
