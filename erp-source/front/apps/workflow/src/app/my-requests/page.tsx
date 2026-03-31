const myRequests = [
  { id: "REQ-0112", type: "Leave Request", submitted: "2024-03-15", status: "pending", approver: "James Lee", details: "Annual leave: Mar 25-29" },
  { id: "REQ-0108", type: "Purchase Order", submitted: "2024-03-10", status: "approved", approver: "Sarah Chen", details: "PO-2024-0155 — $8,200" },
  { id: "REQ-0105", type: "Expense Report", submitted: "2024-03-08", status: "approved", approver: "Mike Ross", details: "Travel expenses — $640" },
  { id: "REQ-0101", type: "Budget Transfer", submitted: "2024-03-05", status: "rejected", approver: "Sarah Chen", details: "Marketing → R&D — $5,000" },
  { id: "REQ-0098", type: "Leave Request", submitted: "2024-03-01", status: "approved", approver: "James Lee", details: "Sick leave: Mar 4" },
];

export default function MyRequestsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
        <p className="text-sm text-gray-500 mt-1">Track your submitted approval requests</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approver</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {myRequests.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-blue-600">{r.id}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{r.type}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{r.details}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{r.submitted}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{r.approver}</td>
                <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  r.status === "approved" ? "bg-green-100 text-green-800" :
                  r.status === "rejected" ? "bg-red-100 text-red-800" :
                  "bg-yellow-100 text-yellow-800"
                }`}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
