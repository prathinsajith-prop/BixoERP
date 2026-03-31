const receipts = [
  { id: "GR-2024-0089", date: "2024-03-15", po: "PO-2024-0158", vendor: "Tech Components Inc", items: 4, received: 4, status: "complete" },
  { id: "GR-2024-0088", date: "2024-03-14", po: "PO-2024-0157", vendor: "Packaging Solutions", items: 4, received: 4, status: "complete" },
  { id: "GR-2024-0087", date: "2024-03-13", po: "PO-2024-0156", vendor: "Metal Works Co", items: 3, received: 3, status: "complete" },
  { id: "GR-2024-0086", date: "2024-03-12", po: "PO-2024-0155", vendor: "Raw Materials Ltd", items: 8, received: 5, status: "partial" },
  { id: "GR-2024-0085", date: "2024-03-10", po: "PO-2024-0153", vendor: "Tech Components Inc", items: 6, received: 6, status: "complete" },
];

export default function ReceivingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Receiving</h1>
        <p className="text-sm text-gray-500 mt-1">Goods receipt & 3-way matching</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt #</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Ref</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Expected</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Received</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {receipts.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3 text-sm font-medium text-blue-600">{r.id}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{r.date}</td>
                <td className="px-4 py-3 text-sm text-blue-600 font-mono">{r.po}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{r.vendor}</td>
                <td className="px-4 py-3 text-sm text-center text-gray-700">{r.items}</td>
                <td className="px-4 py-3 text-sm text-center font-medium text-gray-900">{r.received}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${r.status === "complete" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
