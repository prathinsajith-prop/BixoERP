import { Plus } from "lucide-react";

const creditNotes = [
  { id: "CN-2024-0032", date: "2024-03-14", customer: "Acme Corp", invoice: "INV-2024-0845", reason: "Returned goods", amount: "$2,400", status: "applied" },
  { id: "CN-2024-0031", date: "2024-03-10", customer: "TechStart Inc", invoice: "INV-2024-0830", reason: "Pricing error", amount: "$875", status: "applied" },
  { id: "CN-2024-0030", date: "2024-03-08", customer: "Global Industries", invoice: "INV-2024-0822", reason: "Damaged in transit", amount: "$4,200", status: "pending" },
  { id: "CN-2024-0029", date: "2024-03-05", customer: "Smith & Partners", invoice: "INV-2024-0810", reason: "Service credit", amount: "$1,500", status: "applied" },
];

export default function CreditNotesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Credit Notes</h1>
          <p className="text-sm text-gray-500 mt-1">Issue and track credit notes</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          New Credit Note
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credit Note #</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {creditNotes.map((cn) => (
              <tr key={cn.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3 text-sm font-medium text-blue-600">{cn.id}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{cn.date}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{cn.customer}</td>
                <td className="px-4 py-3 text-sm text-blue-600">{cn.invoice}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{cn.reason}</td>
                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{cn.amount}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cn.status === "applied" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>{cn.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
