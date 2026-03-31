const periods = [
  { id: 1, name: "January 2024", start: "2024-01-01", end: "2024-01-31", status: "closed", entries: 342 },
  { id: 2, name: "February 2024", start: "2024-02-01", end: "2024-02-29", status: "closed", entries: 298 },
  { id: 3, name: "March 2024", start: "2024-03-01", end: "2024-03-31", status: "open", entries: 187 },
  { id: 4, name: "April 2024", start: "2024-04-01", end: "2024-04-30", status: "future", entries: 0 },
  { id: 5, name: "May 2024", start: "2024-05-01", end: "2024-05-31", status: "future", entries: 0 },
  { id: 6, name: "June 2024", start: "2024-06-01", end: "2024-06-30", status: "future", entries: 0 },
];

export default function FiscalPeriodsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fiscal Periods</h1>
        <p className="text-sm text-gray-500 mt-1">Manage accounting periods</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Entries</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {periods.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{p.start}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{p.end}</td>
                <td className="px-4 py-3 text-sm text-center text-gray-700">{p.entries}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    p.status === "closed" ? "bg-gray-100 text-gray-800" :
                    p.status === "open" ? "bg-green-100 text-green-800" :
                    "bg-blue-100 text-blue-800"
                  }`}>{p.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  {p.status === "open" && (
                    <button className="text-sm text-red-600 hover:text-red-700 font-medium">Close Period</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
