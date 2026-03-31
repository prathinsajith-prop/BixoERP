const financialReports = [
  { name: "Income Statement", desc: "Revenue, expenses & net income for a period", frequency: "Monthly", lastRun: "2024-03-01", format: "PDF, Excel" },
  { name: "Balance Sheet", desc: "Assets, liabilities & equity at a point in time", frequency: "Monthly", lastRun: "2024-03-01", format: "PDF, Excel" },
  { name: "Cash Flow Statement", desc: "Operating, investing & financing cash flows", frequency: "Monthly", lastRun: "2024-03-01", format: "PDF" },
  { name: "Trial Balance", desc: "Debit and credit totals for all accounts", frequency: "On Demand", lastRun: "2024-03-10", format: "PDF, Excel" },
  { name: "General Ledger", desc: "All transactions for selected accounts", frequency: "On Demand", lastRun: "2024-03-08", format: "PDF, Excel, CSV" },
  { name: "Aged Receivables", desc: "Outstanding AR by aging bucket", frequency: "Weekly", lastRun: "2024-03-11", format: "PDF, Excel" },
  { name: "Aged Payables", desc: "Outstanding AP by aging bucket", frequency: "Weekly", lastRun: "2024-03-11", format: "PDF, Excel" },
  { name: "Budget vs Actual", desc: "Compare actual figures to budgeted amounts", frequency: "Monthly", lastRun: "2024-03-01", format: "PDF, Excel" },
];

export default function FinancialReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Standard financial statements & accounting reports</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Report</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Run</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Formats</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {financialReports.map((r) => (
              <tr key={r.name} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-500">{r.desc}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{r.frequency}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{r.lastRun}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{r.format}</td>
                <td className="px-4 py-3 text-right">
                  <button className="text-sm text-blue-600 hover:text-blue-800 font-medium mr-3">Run</button>
                  <button className="text-sm text-gray-500 hover:text-gray-700">Schedule</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
