import { Plus } from "lucide-react";

const workOrders = [
  { id: "WO-2024-0084", product: "Gear Assembly C", qty: 300, completed: 120, bom: "BOM-004", start: "2024-03-12", due: "2024-03-22", priority: "high", status: "in_progress" },
  { id: "WO-2024-0083", product: "Housing Unit B", qty: 150, completed: 0, bom: "BOM-003", start: "2024-03-16", due: "2024-03-26", priority: "medium", status: "planned" },
  { id: "WO-2024-0082", product: "Widget Assembly A", qty: 500, completed: 340, bom: "BOM-001", start: "2024-03-10", due: "2024-03-20", priority: "high", status: "in_progress" },
  { id: "WO-2024-0081", product: "Circuit Board X12", qty: 200, completed: 200, bom: "BOM-002", start: "2024-03-08", due: "2024-03-18", priority: "medium", status: "completed" },
  { id: "WO-2024-0080", product: "Sensor Module D", qty: 100, completed: 100, bom: "BOM-005", start: "2024-03-05", due: "2024-03-15", priority: "low", status: "completed" },
];

export default function WorkOrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Production scheduling & tracking</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> New Work Order
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">WO #</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">BOM</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Priority</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {workOrders.map((wo) => {
              const pct = Math.round((wo.completed / wo.qty) * 100);
              return (
                <tr key={wo.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3 text-sm font-medium text-blue-600">{wo.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{wo.product}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono">{wo.bom}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-medium text-gray-600">{wo.completed}/{wo.qty}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{wo.due}</td>
                  <td className="px-4 py-3 text-center"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    wo.priority === "high" ? "bg-red-100 text-red-800" :
                    wo.priority === "medium" ? "bg-yellow-100 text-yellow-800" :
                    "bg-gray-100 text-gray-600"
                  }`}>{wo.priority}</span></td>
                  <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    wo.status === "completed" ? "bg-green-100 text-green-800" :
                    wo.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                    "bg-gray-100 text-gray-600"
                  }`}>{wo.status.replace(/_/g, " ")}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
