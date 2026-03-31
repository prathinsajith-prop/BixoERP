import { Plus } from "lucide-react";

const quotes = [
  { id: "SQ-2024-0102", date: "2024-03-15", customer: "Acme Corp", validUntil: "2024-04-14", items: 5, total: "$24,800", status: "sent" },
  { id: "SQ-2024-0101", date: "2024-03-14", customer: "TechStart Inc", validUntil: "2024-04-13", items: 3, total: "$15,500", status: "draft" },
  { id: "SQ-2024-0100", date: "2024-03-12", customer: "Global Industries", validUntil: "2024-04-11", items: 8, total: "$72,000", status: "accepted" },
  { id: "SQ-2024-0099", date: "2024-03-10", customer: "Summit Corp", validUntil: "2024-04-09", items: 2, total: "$6,800", status: "sent" },
  { id: "SQ-2024-0098", date: "2024-03-08", customer: "NextGen Solutions", validUntil: "2024-04-07", items: 6, total: "$45,200", status: "expired" },
  { id: "SQ-2024-0097", date: "2024-03-05", customer: "Vertex Group", validUntil: "2024-04-04", items: 4, total: "$18,400", status: "rejected" },
];

export default function QuotesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Quotes</h1>
          <p className="text-sm text-gray-500 mt-1">Manage proposals and quotations</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          New Quote
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quote #</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid Until</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Items</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {quotes.map((q) => (
              <tr key={q.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3 text-sm font-medium text-blue-600">{q.id}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{q.customer}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{q.date}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{q.validUntil}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-700">{q.items}</td>
                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{q.total}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    q.status === "accepted" ? "bg-green-100 text-green-800" :
                    q.status === "rejected" ? "bg-red-100 text-red-800" :
                    q.status === "expired" ? "bg-gray-100 text-gray-800" :
                    q.status === "sent" ? "bg-blue-100 text-blue-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}>{q.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
