import { ArrowUpRight, ArrowDownRight } from "lucide-react";

const kpis = [
  { title: "Active Projects", value: "12", change: 2, trend: "up" },
  { title: "Open Tasks", value: "87", change: -5.4, trend: "down" },
  { title: "On Track", value: "83%", change: 4.1, trend: "up" },
  { title: "Billable Hours", value: "1,240 hrs", change: 8.6, trend: "up" },
];

const projects = [
  { id: "PRJ-001", name: "Bixo Platform Migration", client: "Internal", manager: "Sarah Chen", tasks: 42, completed: 28, budget: "$120,000", spent: "$86,400", due: "2024-06-30", status: "on_track" },
  { id: "PRJ-002", name: "Warehouse Automation", client: "LogiTech Corp", manager: "Mike Ross", tasks: 35, completed: 12, budget: "$250,000", spent: "$89,000", due: "2024-08-15", status: "on_track" },
  { id: "PRJ-003", name: "Mobile App v2", client: "Internal", manager: "Anna Park", tasks: 28, completed: 25, budget: "$80,000", spent: "$72,500", due: "2024-04-01", status: "at_risk" },
  { id: "PRJ-004", name: "Vendor Portal", client: "Multi-vendor", manager: "James Lee", tasks: 18, completed: 3, budget: "$65,000", spent: "$12,000", due: "2024-09-30", status: "on_track" },
];

export default function ProjectsDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Projects Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Portfolio overview & progress tracking</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{kpi.value}</p>
            <div className="flex items-center gap-1 mt-1">
              {kpi.trend === "up" ? <ArrowUpRight className="w-4 h-4 text-green-500" /> : <ArrowDownRight className="w-4 h-4 text-green-500" />}
              <span className="text-sm font-medium text-green-600">{Math.abs(kpi.change)}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Active Projects</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manager</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Budget</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.map((p) => {
              const pct = Math.round((p.completed / p.tasks) * 100);
              return (
                <tr key={p.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.client}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{p.manager}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-600">{p.completed}/{p.tasks}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <p className="font-medium text-gray-900">{p.budget}</p>
                    <p className="text-xs text-gray-500">Spent: {p.spent}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.due}</td>
                  <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    p.status === "on_track" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
                  }`}>{p.status.replace(/_/g, " ")}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
