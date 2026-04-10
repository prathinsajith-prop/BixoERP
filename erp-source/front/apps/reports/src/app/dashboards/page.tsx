"use client";

import { Plus, BarChart3 } from "lucide-react";
import { PageHeader, ActionButtons, type ActionButtonItem } from "@erp/ui";

const dashboards = [
  { id: 1, name: "Executive Overview", desc: "Key KPIs across all modules", widgets: 8, updated: "2024-03-15 09:00", owner: "System", shared: true },
  { id: 2, name: "Sales Performance", desc: "Revenue, pipeline & customer metrics", widgets: 6, updated: "2024-03-14 14:30", owner: "Sales Team", shared: true },
  { id: 3, name: "Financial Health", desc: "P&L, cash flow & budget tracking", widgets: 7, updated: "2024-03-15 08:00", owner: "Finance Team", shared: true },
  { id: 4, name: "Operations Monitor", desc: "Inventory, production & procurement", widgets: 5, updated: "2024-03-13 16:00", owner: "Ops Team", shared: true },
  { id: 5, name: "My Dashboard", desc: "Personal metrics & favorites", widgets: 4, updated: "2024-03-15 10:15", owner: "You", shared: false },
];

const pageActions: ActionButtonItem[] = [
  { key: "create", label: "New Dashboard", icon: <Plus className="h-3.5 w-3.5" />, variant: "primary", size: "sm", onClick: () => { } },
];

export default function DashboardsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboards"
        description="Interactive visual dashboards"
        actions={<ActionButtons actions={pageActions} />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dashboards.map((d) => (
          <div key={d.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-blue-300 cursor-pointer space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{d.name}</h3>
                  <p className="text-xs text-gray-500">{d.desc}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{d.widgets} widgets</span>
              <span>{d.shared ? "Shared" : "Private"}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Owner: {d.owner}</span>
              <span>Updated: {d.updated}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
