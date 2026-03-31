import { Plus } from "lucide-react";

const payments = [
  { id: "PAY-2024-0445", date: "2024-03-15", type: "Incoming", method: "Bank Transfer", reference: "INV-2024-0891", party: "TechStart Inc", amount: "$8,750", status: "completed" },
  { id: "PAY-2024-0444", date: "2024-03-14", type: "Outgoing", method: "ACH", reference: "INV-2024-0880", party: "Raw Materials Ltd", amount: "$15,200", status: "completed" },
  { id: "PAY-2024-0443", date: "2024-03-14", type: "Incoming", method: "Credit Card", reference: "INV-2024-0885", party: "Summit Corp", amount: "$3,100", status: "completed" },
  { id: "PAY-2024-0442", date: "2024-03-13", type: "Outgoing", method: "Check", reference: "INV-2024-0878", party: "Equipment Leasing", amount: "$5,400", status: "pending" },
  { id: "PAY-2024-0441", date: "2024-03-12", type: "Incoming", method: "Wire Transfer", reference: "INV-2024-0882", party: "NextGen Solutions", amount: "$31,500", status: "completed" },
];

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500 mt-1">Track incoming and outgoing payments</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment #</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Party</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3 text-sm font-medium text-blue-600">{p.id}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{p.date}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.type === "Incoming" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}>{p.type}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{p.method}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{p.party}</td>
                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{p.amount}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
