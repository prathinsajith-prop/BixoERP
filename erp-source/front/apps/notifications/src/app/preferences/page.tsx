const channels = [
  { name: "Email", desc: "Receive notifications via email", enabled: true },
  { name: "In-App", desc: "Show notifications in the Bixo sidebar", enabled: true },
  { name: "Browser Push", desc: "Desktop push notifications", enabled: false },
  { name: "SMS", desc: "Text message alerts for critical items", enabled: false },
];

const categories = [
  { name: "Approvals", desc: "Pending approvals and workflow items", email: true, inApp: true, push: true },
  { name: "Financial", desc: "Invoice, payment & budget alerts", email: true, inApp: true, push: false },
  { name: "Inventory", desc: "Stock levels & reorder alerts", email: false, inApp: true, push: false },
  { name: "HR & Leave", desc: "Leave requests, payroll updates", email: true, inApp: true, push: false },
  { name: "Projects", desc: "Task assignments & due dates", email: false, inApp: true, push: false },
  { name: "System", desc: "System alerts & maintenance", email: true, inApp: true, push: true },
];

export default function PreferencesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notification Preferences</h1>
        <p className="text-sm text-gray-500 mt-1">Configure how you receive notifications</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Channels</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {channels.map((ch) => (
            <div key={ch.name} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{ch.name}</p>
                <p className="text-xs text-gray-500">{ch.desc}</p>
              </div>
              <div className={`w-10 h-6 rounded-full flex items-center px-0.5 cursor-pointer ${ch.enabled ? "bg-blue-600 justify-end" : "bg-gray-300 justify-start"}`}>
                <div className="w-5 h-5 rounded-full bg-white shadow" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Category Preferences</h2>
        </div>
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">In-App</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Push</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map((c) => (
              <tr key={c.name} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.desc}</p>
                </td>
                <td className="px-4 py-3 text-center">{c.email ? <span className="text-green-600">✓</span> : <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-3 text-center">{c.inApp ? <span className="text-green-600">✓</span> : <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-3 text-center">{c.push ? <span className="text-green-600">✓</span> : <span className="text-gray-300">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
