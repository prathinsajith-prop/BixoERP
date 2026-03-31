import { Shield, Search } from "lucide-react";

const auditLogs = [
  { id: "AUD-00892", timestamp: "2024-03-15 10:32:14", user: "Sarah Chen", module: "Finance", action: "CREATE", entity: "Journal Entry", ref: "JE-2024-0089", details: "Created journal entry for $12,450", ip: "192.168.1.42" },
  { id: "AUD-00891", timestamp: "2024-03-15 10:28:01", user: "Tom Green", module: "Procurement", action: "UPDATE", entity: "Purchase Order", ref: "PO-2024-0161", details: "Changed status to pending_approval", ip: "192.168.1.55" },
  { id: "AUD-00890", timestamp: "2024-03-15 10:15:30", user: "Mike Ross", module: "Inventory", action: "UPDATE", entity: "Stock Level", ref: "ITM-1001", details: "Adjusted quantity from 120 to 115", ip: "192.168.1.38" },
  { id: "AUD-00889", timestamp: "2024-03-15 09:45:12", user: "Anna Park", module: "HR", action: "CREATE", entity: "Leave Request", ref: "LV-2024-0089", details: "Annual leave Mar 25-29", ip: "192.168.1.61" },
  { id: "AUD-00888", timestamp: "2024-03-15 09:30:00", user: "System", module: "Workflow", action: "EXECUTE", entity: "Approval Rule", ref: "RULE-003", details: "Auto-routed PO-2024-0160 to dept manager", ip: "127.0.0.1" },
  { id: "AUD-00887", timestamp: "2024-03-15 09:12:45", user: "James Lee", module: "Projects", action: "UPDATE", entity: "Task", ref: "TSK-0418", details: "Changed status to in_review", ip: "192.168.1.77" },
  { id: "AUD-00886", timestamp: "2024-03-15 08:55:20", user: "Lisa Kim", module: "HR", action: "CREATE", entity: "Payroll Run", ref: "PAY-2024-03", details: "Initiated March 2024 payroll run", ip: "192.168.1.49" },
  { id: "AUD-00885", timestamp: "2024-03-15 08:30:10", user: "David Kim", module: "Sales", action: "CREATE", entity: "Sales Order", ref: "SO-2024-0156", details: "New order for $8,900 — Acme Corp", ip: "192.168.1.33" },
];

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
          <p className="text-sm text-gray-500 mt-1">Complete activity log across all modules</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search logs..." className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <button className="px-3 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50">Export</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
          <p className="text-2xl font-bold text-gray-900">892</p>
          <p className="text-sm text-gray-500">Total Events</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
          <p className="text-2xl font-bold text-blue-600">342</p>
          <p className="text-sm text-gray-500">Creates</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
          <p className="text-2xl font-bold text-yellow-600">486</p>
          <p className="text-sm text-gray-500">Updates</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
          <p className="text-2xl font-bold text-red-600">64</p>
          <p className="text-sm text-gray-500">Deletes</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Module</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {auditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3 text-xs font-mono text-gray-500">{log.timestamp}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{log.user}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{log.module}</td>
                <td className="px-4 py-3 text-center"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  log.action === "CREATE" ? "bg-green-100 text-green-800" :
                  log.action === "UPDATE" ? "bg-blue-100 text-blue-800" :
                  log.action === "DELETE" ? "bg-red-100 text-red-800" :
                  "bg-purple-100 text-purple-800"
                }`}>{log.action}</span></td>
                <td className="px-4 py-3">
                  <p className="text-sm text-gray-900">{log.entity} <span className="text-blue-600 font-mono text-xs">{log.ref}</span></p>
                  <p className="text-xs text-gray-500">{log.details}</p>
                </td>
                <td className="px-4 py-3 text-xs font-mono text-gray-400">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
