const tasks = [
  { id: "TSK-0421", title: "Design database schema", project: "Bixo Platform Migration", assignee: "David Kim", priority: "high", due: "2024-03-18", status: "in_progress" },
  { id: "TSK-0420", title: "Configure CI/CD pipeline", project: "Bixo Platform Migration", assignee: "Sarah Chen", priority: "medium", due: "2024-03-20", status: "todo" },
  { id: "TSK-0419", title: "Barcode scanner integration", project: "Warehouse Automation", assignee: "Mike Ross", priority: "high", due: "2024-03-22", status: "in_progress" },
  { id: "TSK-0418", title: "Push notification system", project: "Mobile App v2", assignee: "Anna Park", priority: "high", due: "2024-03-16", status: "in_review" },
  { id: "TSK-0417", title: "Vendor onboarding flow", project: "Vendor Portal", assignee: "James Lee", priority: "medium", due: "2024-03-25", status: "todo" },
  { id: "TSK-0416", title: "Unit test coverage", project: "Bixo Platform Migration", assignee: "Lisa Kim", priority: "low", due: "2024-03-28", status: "todo" },
  { id: "TSK-0415", title: "Data warehouse ETL", project: "Data Analytics Platform", assignee: "Tom Green", priority: "high", due: "2024-03-19", status: "in_progress" },
];

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <p className="text-sm text-gray-500 mt-1">{tasks.length} open tasks across all projects</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignee</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Priority</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tasks.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">{t.title}</p>
                  <p className="text-xs text-gray-500">{t.id}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{t.project}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{t.assignee}</td>
                <td className="px-4 py-3 text-center"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  t.priority === "high" ? "bg-red-100 text-red-800" :
                  t.priority === "medium" ? "bg-yellow-100 text-yellow-800" :
                  "bg-gray-100 text-gray-600"
                }`}>{t.priority}</span></td>
                <td className="px-4 py-3 text-sm text-gray-500">{t.due}</td>
                <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  t.status === "in_review" ? "bg-purple-100 text-purple-800" :
                  t.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                  "bg-gray-100 text-gray-600"
                }`}>{t.status.replace(/_/g, " ")}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
