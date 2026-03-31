import { Plus } from "lucide-react";

const entries = [
  { id: "JE-2024-1205", date: "2024-03-15", description: "Monthly depreciation", debit: "$12,400", credit: "$12,400", status: "posted", lines: 4 },
  { id: "JE-2024-1204", date: "2024-03-15", description: "Payroll accrual — March", debit: "$85,200", credit: "$85,200", status: "posted", lines: 12 },
  { id: "JE-2024-1203", date: "2024-03-14", description: "Revenue recognition — Q1", debit: "$145,000", credit: "$145,000", status: "pending", lines: 8 },
  { id: "JE-2024-1202", date: "2024-03-14", description: "Prepaid insurance amortization", debit: "$3,600", credit: "$3,600", status: "posted", lines: 2 },
  { id: "JE-2024-1201", date: "2024-03-13", description: "Vendor payment batch", debit: "$67,800", credit: "$67,800", status: "posted", lines: 15 },
  { id: "JE-2024-1200", date: "2024-03-13", description: "Intercompany transfer", debit: "$250,000", credit: "$250,000", status: "posted", lines: 6 },
  { id: "JE-2024-1199", date: "2024-03-12", description: "Accrued interest", debit: "$4,200", credit: "$4,200", status: "posted", lines: 2 },
  { id: "JE-2024-1198", date: "2024-03-12", description: "Bad debt write-off", debit: "$8,500", credit: "$8,500", status: "reversed", lines: 2 },
];

export default function JournalEntriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Journal Entries</h1>
          <p className="text-sm text-gray-500 mt-1">Manual and auto-generated entries</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          New Entry
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entry #</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Lines</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3 text-sm font-medium text-blue-600">{e.id}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{e.date}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{e.description}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{e.debit}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{e.credit}</td>
                <td className="px-4 py-3 text-sm text-center text-gray-500">{e.lines}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    e.status === "posted" ? "bg-green-100 text-green-800" :
                    e.status === "reversed" ? "bg-red-100 text-red-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}>{e.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
