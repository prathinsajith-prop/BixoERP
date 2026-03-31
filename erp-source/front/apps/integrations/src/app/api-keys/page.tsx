import { Plus, Key } from "lucide-react";

const apiKeys = [
  { id: 1, name: "Production API Key", prefix: "bixo_live_", created: "2024-01-15", lastUsed: "2024-03-15 10:32", status: "active", calls: "12,450" },
  { id: 2, name: "Staging API Key", prefix: "bixo_test_", created: "2024-02-01", lastUsed: "2024-03-14 16:00", status: "active", calls: "3,280" },
  { id: 3, name: "Webhook Signing Key", prefix: "whk_", created: "2024-01-20", lastUsed: "2024-03-15 10:00", status: "active", calls: "8,900" },
  { id: 4, name: "Mobile App Key", prefix: "bixo_mob_", created: "2024-03-01", lastUsed: "2024-03-15 09:45", status: "active", calls: "1,560" },
  { id: 5, name: "Legacy System Key", prefix: "bixo_leg_", created: "2023-06-01", lastUsed: "2024-02-10 12:00", status: "revoked", calls: "45,200" },
];

const webhooks = [
  { id: 1, url: "https://hooks.example.com/bixo/orders", events: ["order.created", "order.updated"], status: "active", success: 98.5 },
  { id: 2, url: "https://hooks.example.com/bixo/invoices", events: ["invoice.created", "invoice.paid"], status: "active", success: 99.1 },
  { id: 3, url: "https://hooks.example.com/bixo/inventory", events: ["stock.low", "stock.adjusted"], status: "active", success: 97.8 },
];

export default function APIKeysPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys & Webhooks</h1>
          <p className="text-sm text-gray-500 mt-1">Manage API access & webhook endpoints</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> New API Key
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <Key className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key Prefix</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">API Calls</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {apiKeys.map((k) => (
              <tr key={k.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{k.name}</td>
                <td className="px-4 py-3 text-sm font-mono text-gray-500">{k.prefix}••••••••</td>
                <td className="px-4 py-3 text-sm text-gray-500">{k.created}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-700">{k.calls}</td>
                <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${k.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{k.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Webhooks</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {webhooks.map((w) => (
            <div key={w.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
              <div>
                <p className="text-sm font-mono text-gray-900">{w.url}</p>
                <p className="text-xs text-gray-500 mt-0.5">{w.events.join(", ")}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">{w.success}% success</span>
                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">{w.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
