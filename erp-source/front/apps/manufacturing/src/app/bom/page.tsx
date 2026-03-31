import { Plus } from "lucide-react";

const boms = [
  { id: "BOM-001", product: "Widget Assembly A", version: "3.2", components: 12, cost: "$34.50", status: "active" },
  { id: "BOM-002", product: "Circuit Board X12", version: "2.1", components: 28, cost: "$78.90", status: "active" },
  { id: "BOM-003", product: "Housing Unit B", version: "1.5", components: 6, cost: "$22.10", status: "active" },
  { id: "BOM-004", product: "Gear Assembly C", version: "4.0", components: 15, cost: "$45.60", status: "active" },
  { id: "BOM-005", product: "Sensor Module D", version: "1.0", components: 8, cost: "$56.20", status: "draft" },
  { id: "BOM-006", product: "Power Supply E", version: "2.3", components: 18, cost: "$31.80", status: "obsolete" },
];

export default function BOMPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bill of Materials</h1>
          <p className="text-sm text-gray-500 mt-1">Product recipes & component lists</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> New BOM
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">BOM ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Version</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Components</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {boms.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3 text-sm font-medium text-blue-600">{b.id}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{b.product}</td>
                <td className="px-4 py-3 text-sm text-center text-gray-500">v{b.version}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-700">{b.components}</td>
                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{b.cost}</td>
                <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  b.status === "active" ? "bg-green-100 text-green-800" :
                  b.status === "draft" ? "bg-yellow-100 text-yellow-800" :
                  "bg-gray-100 text-gray-600"
                }`}>{b.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
