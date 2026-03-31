const stockLevels = [
  { sku: "MTR-STP-42", name: "Stepper Motor NEMA 42", warehouse: "Main", available: 45, reserved: 22, incoming: 50, reorder: 30, status: "ok" },
  { sku: "CBL-USB-C3M", name: "USB-C Cable 3m", warehouse: "Main", available: 280, reserved: 60, incoming: 0, reorder: 100, status: "ok" },
  { sku: "HSK-ALU-L", name: "Aluminum Heatsink Large", warehouse: "West", available: 65, reserved: 24, incoming: 100, reorder: 50, status: "ok" },
  { sku: "WDG-ASM-001", name: "Widget Assembly Kit", warehouse: "Main", available: 8, reserved: 4, incoming: 0, reorder: 50, status: "low" },
  { sku: "BRG-6205", name: "Ball Bearing 6205", warehouse: "West", available: 5, reserved: 3, incoming: 25, reorder: 25, status: "critical" },
  { sku: "PCB-CTL-102", name: "Control Board PCB v1.2", warehouse: "East", available: 3, reserved: 2, incoming: 20, reorder: 20, status: "critical" },
];

export default function StockLevelsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stock Levels</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time stock across all warehouses</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Available</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Reserved</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Incoming</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stockLevels.map((s) => (
              <tr key={`${s.sku}-${s.warehouse}`} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-mono text-blue-600">{s.sku}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{s.name}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{s.warehouse}</td>
                <td className="px-4 py-3 text-sm text-center font-medium text-gray-900">{s.available}</td>
                <td className="px-4 py-3 text-sm text-center text-gray-500">{s.reserved}</td>
                <td className="px-4 py-3 text-sm text-center text-green-600">{s.incoming || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    s.status === "ok" ? "bg-green-100 text-green-800" : s.status === "low" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                  }`}>{s.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
