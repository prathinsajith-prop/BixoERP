"use client";

import { DataTable, PageHeader, type TableColumn } from "@erp/ui";

type TimeEntry = { id: number; date: string; employee: string; project: string; task: string; hours: number; billable: boolean; rate: string; total: string };

const timeEntryColumns: TableColumn<TimeEntry>[] = [
  { key: 'date', header: 'Date', render: (e) => <span className="text-sm text-gray-500">{e.date}</span> },
  { key: 'employee', header: 'Employee', render: (e) => <span className="text-sm font-medium text-gray-900">{e.employee}</span> },
  {
    key: 'project', header: 'Project / Task', render: (e) => (
      <div><p className="text-sm text-gray-900">{e.project}</p><p className="text-xs text-gray-500">{e.task}</p></div>
    )
  },
  { key: 'hours', header: 'Hours', align: 'right' as const, render: (e) => <span className="text-sm font-medium text-gray-900">{e.hours}</span> },
  {
    key: 'billable', header: 'Billable', align: 'center' as const, render: (e) => (
      e.billable ? <span className="text-green-600 text-sm">✓</span> : <span className="text-gray-400 text-sm">—</span>
    )
  },
  { key: 'total', header: 'Total', align: 'right' as const, render: (e) => <span className="text-sm font-medium text-gray-900">{e.total}</span> },
];

const timeEntries: TimeEntry[] = [
  { id: 1, date: "2024-03-15", employee: "David Kim", project: "Bixo Platform Migration", task: "Database schema design", hours: 6.5, billable: true, rate: "$120", total: "$780" },
  { id: 2, date: "2024-03-15", employee: "Mike Ross", project: "Warehouse Automation", task: "Barcode scanner R&D", hours: 8.0, billable: true, rate: "$110", total: "$880" },
  { id: 3, date: "2024-03-15", employee: "Anna Park", project: "Mobile App v2", task: "Notification testing", hours: 4.0, billable: true, rate: "$100", total: "$400" },
  { id: 4, date: "2024-03-14", employee: "Sarah Chen", project: "Bixo Platform Migration", task: "Sprint planning", hours: 2.0, billable: false, rate: "$130", total: "—" },
  { id: 5, date: "2024-03-14", employee: "Tom Green", project: "Data Analytics Platform", task: "ETL pipeline", hours: 7.5, billable: true, rate: "$115", total: "$862.50" },
  { id: 6, date: "2024-03-14", employee: "James Lee", project: "Vendor Portal", task: "Wireframe review", hours: 3.0, billable: true, rate: "$100", total: "$300" },
];

export default function TimeTrackingPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Time Tracking" description="Logged hours & billable time" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
          <p className="text-sm text-gray-500">This Week</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">156.5 hrs</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
          <p className="text-sm text-gray-500">Billable</p>
          <p className="text-2xl font-bold text-green-600 mt-1">128.0 hrs</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
          <p className="text-sm text-gray-500">Revenue</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">$14,520</p>
        </div>
      </div>

      <DataTable<TimeEntry> columns={timeEntryColumns} data={timeEntries} keyExtractor={(e) => String(e.id)} />
    </div>
  );
}
