import { Bell, CheckCircle2, AlertTriangle, Info } from "lucide-react";

const notifications = [
  { id: 1, type: "approval", icon: AlertTriangle, color: "text-yellow-600 bg-yellow-100", title: "Purchase Order requires approval", desc: "PO-2024-0161 — $28,600 from Raw Materials Ltd", time: "10 min ago", read: false },
  { id: 2, type: "info", icon: Info, color: "text-blue-600 bg-blue-100", title: "Payroll run completed", desc: "March 2024 payroll processed for 156 employees", time: "1 hour ago", read: false },
  { id: 3, type: "success", icon: CheckCircle2, color: "text-green-600 bg-green-100", title: "Invoice INV-2024-0312 paid", desc: "Payment of $12,450 received from Acme Corp", time: "2 hours ago", read: false },
  { id: 4, type: "warning", icon: AlertTriangle, color: "text-orange-600 bg-orange-100", title: "Low inventory alert", desc: "Widget Component X below reorder point (45 remaining)", time: "3 hours ago", read: true },
  { id: 5, type: "info", icon: Info, color: "text-blue-600 bg-blue-100", title: "Leave request approved", desc: "Your leave request for Mar 25-29 was approved by James Lee", time: "5 hours ago", read: true },
  { id: 6, type: "success", icon: CheckCircle2, color: "text-green-600 bg-green-100", title: "Work order WO-2024-0081 completed", desc: "Circuit Board X12 — 200 units produced", time: "Yesterday", read: true },
  { id: 7, type: "info", icon: Info, color: "text-blue-600 bg-blue-100", title: "New vendor registered", desc: "Green Energy Supplies added to approved vendors", time: "Yesterday", read: true },
  { id: 8, type: "approval", icon: AlertTriangle, color: "text-yellow-600 bg-yellow-100", title: "Expense report pending review", desc: "EXP-2024-0045 — $1,240 from David Kim", time: "2 days ago", read: true },
];

export default function NotificationsPage() {
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">{unread} unread notifications</p>
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">Mark all as read</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        {notifications.map((n) => (
          <div key={n.id} className={`px-6 py-4 flex items-start gap-3 hover:bg-gray-50 cursor-pointer ${!n.read ? "bg-blue-50/50" : ""}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${n.color}`}>
              <n.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`text-sm ${!n.read ? "font-semibold" : "font-medium"} text-gray-900`}>{n.title}</p>
                {!n.read && <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{n.desc}</p>
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0">{n.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
