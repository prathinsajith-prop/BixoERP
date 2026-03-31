const agingData = {
  receivable: [
    { customer: "Acme Corp", current: 12400, d30: 8200, d60: 0, d90: 0, over90: 0, total: 20600 },
    { customer: "Global Industries", current: 0, d30: 15800, d60: 22400, d90: 7000, over90: 0, total: 45200 },
    { customer: "NextGen Solutions", current: 31500, d30: 0, d60: 0, d90: 0, over90: 0, total: 31500 },
    { customer: "Summit Corp", current: 18200, d30: 12400, d60: 5600, d90: 0, over90: 0, total: 36200 },
    { customer: "Vertex Group", current: 14200, d30: 8500, d60: 0, d90: 0, over90: 0, total: 22700 },
  ],
  payable: [
    { customer: "Raw Materials Ltd", current: 28600, d30: 12400, d60: 0, d90: 0, over90: 0, total: 41000 },
    { customer: "Office Supply Co", current: 3200, d30: 1800, d60: 2400, d90: 0, over90: 0, total: 7400 },
    { customer: "Equipment Leasing", current: 5400, d30: 5400, d60: 5400, d90: 0, over90: 0, total: 16200 },
  ],
};

function fmt(n: number) {
  return n === 0 ? "—" : `$${n.toLocaleString()}`;
}

export default function AgingReportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Aging Report</h1>
        <p className="text-sm text-gray-500 mt-1">Outstanding balances by age bucket</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Accounts Receivable Aging</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">1-30</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">31-60</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">61-90</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">90+</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {agingData.receivable.map((r) => (
              <tr key={r.customer}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.customer}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-700">{fmt(r.current)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-700">{fmt(r.d30)}</td>
                <td className="px-4 py-3 text-sm text-right text-yellow-600">{fmt(r.d60)}</td>
                <td className="px-4 py-3 text-sm text-right text-orange-600">{fmt(r.d90)}</td>
                <td className="px-4 py-3 text-sm text-right text-red-600">{fmt(r.over90)}</td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{fmt(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Accounts Payable Aging</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">1-30</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">31-60</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">61-90</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">90+</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {agingData.payable.map((r) => (
              <tr key={r.customer}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.customer}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-700">{fmt(r.current)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-700">{fmt(r.d30)}</td>
                <td className="px-4 py-3 text-sm text-right text-yellow-600">{fmt(r.d60)}</td>
                <td className="px-4 py-3 text-sm text-right text-orange-600">{fmt(r.d90)}</td>
                <td className="px-4 py-3 text-sm text-right text-red-600">{fmt(r.over90)}</td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{fmt(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
