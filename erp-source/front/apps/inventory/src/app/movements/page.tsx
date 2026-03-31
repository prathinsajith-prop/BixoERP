const movements = [
  { id: "SM-2024-0312", date: "2024-03-15", type: "Receipt", sku: "MTR-STP-42", item: "Stepper Motor NEMA 42", qty: 50, from: "Vendor", to: "Main WH", ref: "PO-2024-0155" },
  { id: "SM-2024-0311", date: "2024-03-15", type: "Issue", sku: "WDG-ASM-001", item: "Widget Assembly Kit", qty: 8, from: "Main WH", to: "Production", ref: "WO-2024-0089" },
  { id: "SM-2024-0310", date: "2024-03-14", type: "Transfer", sku: "CBL-USB-C3M", item: "USB-C Cable 3m", qty: 100, from: "Main WH", to: "West DC", ref: "TR-2024-0045" },
  { id: "SM-2024-0309", date: "2024-03-14", type: "Receipt", sku: "HSK-ALU-L", item: "Aluminum Heatsink Large", qty: 100, from: "Vendor", to: "West DC", ref: "PO-2024-0153" },
  { id: "SM-2024-0308", date: "2024-03-13", type: "Adjustment", sku: "SCR-HEX-M6", item: "Hex Screw M6x20", qty: -12, from: "Main WH", to: "Shrinkage", ref: "ADJ-2024-0022" },
];

const typeColors: Record<string, string> = {
  Receipt: "bg-green-100 text-green-800",
  Issue: "bg-blue-100 text-blue-800",
  Transfer: "bg-purple-100 text-purple-800",
  Adjustment: "bg-yellow-100 text-yellow-800",
};

export default function MovementsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1>
        <p className="text-sm text-gray-500 mt-1">Receipts, issues, transfers & adjustments</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From → To</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {movements.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-blue-600">{m.id}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{m.date}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[m.type]}`}>{m.type}</span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-gray-900">{m.item}</p>
                  <p className="text-xs text-gray-400 font-mono">{m.sku}</p>
                </td>
                <td className="px-4 py-3 text-sm text-center font-medium text-gray-900">{m.qty}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{m.from} → {m.to}</td>
                <td className="px-4 py-3 text-sm text-blue-600 font-mono">{m.ref}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
