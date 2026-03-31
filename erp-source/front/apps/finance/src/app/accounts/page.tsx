"use client";

import { useState } from "react";
import { Plus, Search, ChevronRight } from "lucide-react";

const accounts = [
  { code: "1000", name: "Cash and Cash Equivalents", type: "asset", balance: "$1,124,300", parent: null },
  { code: "1010", name: "Checking Account", type: "asset", balance: "$845,200", parent: "1000" },
  { code: "1020", name: "Savings Account", type: "asset", balance: "$279,100", parent: "1000" },
  { code: "1100", name: "Accounts Receivable", type: "asset", balance: "$384,200", parent: null },
  { code: "1200", name: "Inventory", type: "asset", balance: "$1,245,680", parent: null },
  { code: "1300", name: "Prepaid Expenses", type: "asset", balance: "$45,600", parent: null },
  { code: "1500", name: "Fixed Assets", type: "asset", balance: "$890,000", parent: null },
  { code: "1510", name: "Buildings", type: "asset", balance: "$650,000", parent: "1500" },
  { code: "1520", name: "Equipment", type: "asset", balance: "$240,000", parent: "1500" },
  { code: "2000", name: "Accounts Payable", type: "liability", balance: "$256,400", parent: null },
  { code: "2100", name: "Accrued Liabilities", type: "liability", balance: "$128,700", parent: null },
  { code: "2200", name: "Notes Payable", type: "liability", balance: "$500,000", parent: null },
  { code: "2300", name: "Tax Payable", type: "liability", balance: "$89,200", parent: null },
  { code: "3000", name: "Common Stock", type: "equity", balance: "$1,000,000", parent: null },
  { code: "3100", name: "Retained Earnings", type: "equity", balance: "$1,393,300", parent: null },
  { code: "4000", name: "Sales Revenue", type: "revenue", balance: "$2,847,320", parent: null },
  { code: "4100", name: "Service Revenue", type: "revenue", balance: "$245,000", parent: null },
  { code: "5000", name: "Cost of Goods Sold", type: "expense", balance: "$1,425,000", parent: null },
  { code: "6000", name: "Operating Expenses", type: "expense", balance: "$412,000", parent: null },
  { code: "6100", name: "Marketing Expenses", type: "expense", balance: "$134,400", parent: null },
];

const typeColors: Record<string, string> = {
  asset: "bg-blue-100 text-blue-800",
  liability: "bg-red-100 text-red-800",
  equity: "bg-purple-100 text-purple-800",
  revenue: "bg-green-100 text-green-800",
  expense: "bg-yellow-100 text-yellow-800",
};

export default function ChartOfAccountsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = accounts.filter((a) => {
    if (filter !== "all" && a.type !== filter) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.code.includes(search)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
          <p className="text-sm text-gray-500 mt-1">{accounts.length} accounts</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          New Account
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-300 focus:ring-2 focus:ring-blue-100 focus:outline-none"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {["all", "asset", "liability", "equity", "revenue", "expense"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize ${filter === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((a) => (
              <tr key={a.code} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3 text-sm font-mono text-gray-900">{a.code}</td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  <div className="flex items-center gap-1">
                    {a.parent && <ChevronRight className="w-3 h-3 text-gray-400 ml-4" />}
                    <span className={a.parent ? "text-gray-600" : "font-medium"}>{a.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${typeColors[a.type]}`}>{a.type}</span>
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{a.balance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
