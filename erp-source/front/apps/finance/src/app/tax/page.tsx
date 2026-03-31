const taxCodes = [
  { code: "VAT-STD", name: "Standard VAT", rate: "20%", type: "Output", status: "active" },
  { code: "VAT-RED", name: "Reduced Rate VAT", rate: "5%", type: "Output", status: "active" },
  { code: "VAT-ZERO", name: "Zero Rate VAT", rate: "0%", type: "Output", status: "active" },
  { code: "VAT-EX", name: "VAT Exempt", rate: "0%", type: "Exempt", status: "active" },
  { code: "GST-10", name: "GST Standard", rate: "10%", type: "Output", status: "active" },
  { code: "WHT-15", name: "Withholding Tax", rate: "15%", type: "Input", status: "active" },
];

const taxReturns = [
  { period: "Jan 2024", dueDate: "2024-02-28", outputTax: "$45,200", inputTax: "$28,100", net: "$17,100", status: "filed" },
  { period: "Feb 2024", dueDate: "2024-03-31", outputTax: "$52,800", inputTax: "$31,400", net: "$21,400", status: "filed" },
  { period: "Mar 2024", dueDate: "2024-04-30", outputTax: "$38,600", inputTax: "$22,900", net: "$15,700", status: "draft" },
];

export default function TaxManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tax Management</h1>
        <p className="text-sm text-gray-500 mt-1">Tax codes, rates, and return filing</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Tax Codes</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Rate</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {taxCodes.map((t) => (
              <tr key={t.code} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-mono text-gray-900">{t.code}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{t.name}</td>
                <td className="px-4 py-3 text-sm text-center font-medium text-gray-900">{t.rate}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{t.type}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">{t.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Tax Returns</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Output Tax</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Input Tax</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Payable</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {taxReturns.map((r) => (
              <tr key={r.period}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.period}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{r.dueDate}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{r.outputTax}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{r.inputTax}</td>
                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{r.net}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${r.status === "filed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
