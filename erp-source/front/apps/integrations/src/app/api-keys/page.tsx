"use client";

import { Plus, Key } from "lucide-react";
import { DataTable, PageHeader, StatusBadge, ActionButtons, type ActionButtonItem, type TableColumn } from "@erp/ui";

type ApiKey = { id: number; name: string; prefix: string; created: string; lastUsed: string; status: string; calls: string };

const apiKeyColumns: TableColumn<ApiKey>[] = [
  { key: 'name', header: 'Name', render: (k) => <span className="text-sm font-medium text-gray-900">{k.name}</span> },
  { key: 'prefix', header: 'Key Prefix', render: (k) => <span className="text-sm font-mono text-gray-500">{k.prefix}••••••••</span> },
  { key: 'created', header: 'Created', render: (k) => <span className="text-sm text-gray-500">{k.created}</span> },
  { key: 'calls', header: 'API Calls', align: 'right' as const, render: (k) => <span className="text-sm text-gray-700">{k.calls}</span> },
  { key: 'status', header: 'Status', render: (k) => <StatusBadge status={k.status} /> },
];

const apiKeys: ApiKey[] = [
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

const pageActions: ActionButtonItem[] = [
  { key: "create", label: "New API Key", icon: <Plus className="h-3.5 w-3.5" />, variant: "primary", size: "sm", onClick: () => { } },
];

export default function APIKeysPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="API Keys & Webhooks"
        description="Manage API access & webhook endpoints"
        actions={<ActionButtons actions={pageActions} />}
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <Key className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
        </div>
        <DataTable<ApiKey> columns={apiKeyColumns} data={apiKeys} keyExtractor={(k) => String(k.id)} />
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
                <StatusBadge status={w.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
