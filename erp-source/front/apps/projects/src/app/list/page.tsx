import { Plus, FolderKanban } from "lucide-react";

const allProjects = [
  { id: "PRJ-001", name: "Bixo Platform Migration", client: "Internal", manager: "Sarah Chen", start: "2024-01-15", due: "2024-06-30", budget: "$120,000", tasks: 42, completed: 28, status: "on_track" },
  { id: "PRJ-002", name: "Warehouse Automation", client: "LogiTech Corp", manager: "Mike Ross", start: "2024-02-01", due: "2024-08-15", budget: "$250,000", tasks: 35, completed: 12, status: "on_track" },
  { id: "PRJ-003", name: "Mobile App v2", client: "Internal", manager: "Anna Park", start: "2023-11-01", due: "2024-04-01", budget: "$80,000", tasks: 28, completed: 25, status: "at_risk" },
  { id: "PRJ-004", name: "Vendor Portal", client: "Multi-vendor", manager: "James Lee", start: "2024-03-01", due: "2024-09-30", budget: "$65,000", tasks: 18, completed: 3, status: "on_track" },
  { id: "PRJ-005", name: "Data Analytics Platform", client: "Internal", manager: "Lisa Kim", start: "2024-01-01", due: "2024-12-31", budget: "$180,000", tasks: 56, completed: 10, status: "on_track" },
  { id: "PRJ-006", name: "Office Renovation", client: "Facilities", manager: "Tom Green", start: "2023-09-01", due: "2024-02-28", budget: "$95,000", tasks: 22, completed: 22, status: "completed" },
];

export default function ProjectListPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Projects</h1>
          <p className="text-sm text-gray-500 mt-1">{allProjects.length} projects</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allProjects.map((p) => {
          const pct = Math.round((p.completed / p.tasks) * 100);
          return (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-blue-300 cursor-pointer space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FolderKanban className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{p.name}</h3>
                    <p className="text-xs text-gray-500">{p.client}</p>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  p.status === "completed" ? "bg-green-100 text-green-800" :
                  p.status === "on_track" ? "bg-blue-100 text-blue-800" :
                  "bg-orange-100 text-orange-800"
                }`}>{p.status.replace(/_/g, " ")}</span>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{p.completed}/{p.tasks} tasks ({pct}%)</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Manager: {p.manager}</span>
                <span>Due: {p.due}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
