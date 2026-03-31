"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

const invoices = [
  { num: "INV-2024-0892", type: "AR", customer: "Acme Corp", date: "2024-03-15", due: "2024-04-14", amount: "$12,400", balance: "$12,400", status: "open" },
  { num: "INV-2024-0891", type: "AR", customer: "TechStart Inc", date: "2024-03-14", due: "2024-04-13", amount: "$8,750", balance: "$0", status: "paid" },
  { num: "INV-2024-0890", type: "AP", customer: "Office Supply Co", date: "2024-03-13", due: "2024-04-12", amount: "$3,200", balance: "$3,200", status: "open" },
  { num: "INV-2024-0889", type: "AR", customer: "Global Industries", date: "2024-03-12", due: "2024-03-12", amount: "$45,200", balance: "$45,200", status: "overdue" },
  { num: "INV-2024-0888", type: "AP", customer: "Raw Materials Ltd", date: "2024-03-10", due: "2024-04-09", amount: "$28,600", balance: "$28,600", status: "open" },
  { num: "INV-2024-0887", type: "AR", customer: "Smith & Partners", date: "2024-03-08", due: "2024-04-07", amount: "$18,900", balance: "$0", status: "paid" },
  { num: "INV-2024-0886", type: "AP", customer: "Equipment Leasing", date: "2024-03-05", due: "2024-04-04", amount: "$5,400", balance: "$5,400", status: "open" },
];

export default function InvoicesPage() {
  const [filter, setFilter] = useState<string>("all");
  const filtered = filter === "all" ? invoices : invoices.filter((i) => i.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">Manage receivable & payable invoices</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          New Invoice
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {[{ key: "all", label: "All" }, { key: "AR", label: "Receivable" }, { key: "AP", label: "Payable" }].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md ${filter === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer / Vendor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((inv) => (
              <tr key={inv.num} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3 text-sm font-medium text-blue-600">{inv.num}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${inv.type === "AR" ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"}`}>{inv.type}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{inv.customer}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{inv.due}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{inv.amount}</td>
                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{inv.balance}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    inv.status === "paid" ? "bg-green-100 text-green-800" :
                    inv.status === "overdue" ? "bg-red-100 text-red-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}>{inv.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
