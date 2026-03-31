"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";

const items = [
  { sku: "WDG-ASM-001", name: "Widget Assembly Kit", category: "Assemblies", cost: "$24.50", sell: "$45.00", stock: 12, status: "low" },
  { sku: "SCR-HEX-M6", name: "Hex Screw M6x20", category: "Fasteners", cost: "$0.12", sell: "$0.25", stock: 145, status: "low" },
  { sku: "MTR-STP-42", name: "Stepper Motor NEMA 42", category: "Motors", cost: "$85.00", sell: "$142.00", stock: 67, status: "ok" },
  { sku: "BRG-6205", name: "Ball Bearing 6205", category: "Bearings", cost: "$12.40", sell: "$22.00", stock: 8, status: "critical" },
  { sku: "SLD-CMP-003", name: "Solder Compound Type B", category: "Consumables", cost: "$34.00", sell: "$58.00", stock: 2, status: "critical" },
  { sku: "PCB-CTL-102", name: "Control Board PCB v1.2", category: "Electronics", cost: "$120.00", sell: "$210.00", stock: 5, status: "low" },
  { sku: "CBL-USB-C3M", name: "USB-C Cable 3m", category: "Cables", cost: "$4.20", sell: "$9.99", stock: 340, status: "ok" },
  { sku: "HSK-ALU-L", name: "Aluminum Heatsink Large", category: "Thermal", cost: "$8.50", sell: "$15.00", stock: 89, status: "ok" },
];

export default function ItemsPage() {
  const [search, setSearch] = useState("");
  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Items</h1>
          <p className="text-sm text-gray-500 mt-1">{items.length} items</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-300 focus:ring-2 focus:ring-blue-100 focus:outline-none" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sell</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((i) => (
              <tr key={i.sku} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3 text-sm font-mono text-blue-600">{i.sku}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{i.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{i.category}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-700">{i.cost}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{i.sell}</td>
                <td className="px-4 py-3 text-sm text-center font-medium text-gray-900">{i.stock}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    i.status === "ok" ? "bg-green-100 text-green-800" : i.status === "low" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                  }`}>{i.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
