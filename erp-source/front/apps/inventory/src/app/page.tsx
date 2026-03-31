import { Package, AlertTriangle, ArrowUpRight, ArrowDownRight } from "lucide-react";

const kpis = [
  { title: "Total SKUs", value: "1,247", change: 3.2, trend: "up" },
  { title: "Inventory Value", value: "$1,245,680", change: 5.1, trend: "up" },
  { title: "Below Reorder", value: "8", change: 33.3, trend: "up" },
  { title: "Warehouses", value: "3", change: 0, trend: "up" },
];

const belowReorder = [
  { sku: "WDG-ASM-001", name: "Widget Assembly Kit", stock: 12, reorder: 50, warehouse: "Main" },
  { sku: "SCR-HEX-M6", name: "Hex Screw M6x20", stock: 145, reorder: 500, warehouse: "Main" },
  { sku: "BRG-6205", name: "Ball Bearing 6205", stock: 8, reorder: 25, warehouse: "West" },
  { sku: "SLD-CMP-003", name: "Solder Compound Type B", stock: 2, reorder: 10, warehouse: "Main" },
  { sku: "PCB-CTL-102", name: "Control Board PCB v1.2", stock: 5, reorder: 20, warehouse: "East" },
];

export default function InventoryDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Stock overview and alerts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{kpi.value}</p>
            {kpi.change > 0 && (
              <div className="flex items-center gap-1 mt-1">
                {kpi.title === "Below Reorder" ? (
                  <ArrowUpRight className="w-4 h-4 text-red-500" />
                ) : (
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                )}
                <span className={`text-sm font-medium ${kpi.title === "Below Reorder" ? "text-red-600" : "text-green-600"}`}>{kpi.change}%</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-semibold text-gray-900">Below Reorder Level</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Reorder Point</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {belowReorder.map((item) => (
              <tr key={item.sku} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-mono text-blue-600">{item.sku}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                <td className="px-4 py-3 text-sm text-center font-medium text-red-600">{item.stock}</td>
                <td className="px-4 py-3 text-sm text-center text-gray-500">{item.reorder}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{item.warehouse}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
