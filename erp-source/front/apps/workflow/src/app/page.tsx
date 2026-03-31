import { Clock, CheckCircle2, XCircle } from "lucide-react";

const pendingApprovals = [
  { id: "APR-0201", type: "Purchase Order", ref: "PO-2024-0161", requester: "Tom Green", amount: "$28,600", submitted: "2024-03-15 10:30", urgency: "high" },
  { id: "APR-0200", type: "Leave Request", ref: "LV-2024-0089", requester: "Anna Park", amount: "5 days", submitted: "2024-03-14 16:00", urgency: "medium" },
  { id: "APR-0199", type: "Expense Report", ref: "EXP-2024-0045", requester: "David Kim", amount: "$1,240", submitted: "2024-03-14 11:15", urgency: "low" },
  { id: "APR-0198", type: "Budget Transfer", ref: "BT-2024-0012", requester: "Sarah Chen", amount: "$15,000", submitted: "2024-03-13 09:00", urgency: "high" },
  { id: "APR-0197", type: "Vendor Onboarding", ref: "VND-2024-0034", requester: "Mike Ross", amount: "—", submitted: "2024-03-12 14:30", urgency: "medium" },
];

const stats = [
  { label: "Pending", value: 12, icon: Clock, color: "text-yellow-600 bg-yellow-100" },
  { label: "Approved Today", value: 8, icon: CheckCircle2, color: "text-green-600 bg-green-100" },
  { label: "Rejected Today", value: 2, icon: XCircle, color: "text-red-600 bg-red-100" },
];

export default function WorkflowDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Workflow & Approvals</h1>
        <p className="text-sm text-gray-500 mt-1">Pending approvals & automation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {pendingApprovals.map((a) => (
            <div key={a.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{a.type}</p>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    a.urgency === "high" ? "bg-red-100 text-red-700" :
                    a.urgency === "medium" ? "bg-yellow-100 text-yellow-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>{a.urgency}</span>
                </div>
                <p className="text-xs text-gray-500">{a.ref} · {a.requester} · {a.submitted}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 mr-4">{a.amount}</span>
                <button className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700">Approve</button>
                <button className="px-3 py-1.5 text-xs font-medium bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
