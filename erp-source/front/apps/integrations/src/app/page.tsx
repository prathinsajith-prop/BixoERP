import { Plug, CheckCircle2, XCircle, Clock } from "lucide-react";
import { PageHeader, StatusBadge } from "@erp/ui";

const integrations = [
  { name: "Stripe", desc: "Payment processing & billing", category: "Payments", status: "connected", lastSync: "2024-03-15 10:00", icon: "💳" },
  { name: "QuickBooks", desc: "Accounting sync", category: "Accounting", status: "connected", lastSync: "2024-03-15 08:00", icon: "📊" },
  { name: "Salesforce", desc: "CRM data synchronization", category: "CRM", status: "connected", lastSync: "2024-03-15 09:30", icon: "☁️" },
  { name: "Slack", desc: "Notifications & alerts", category: "Communication", status: "connected", lastSync: "2024-03-15 10:32", icon: "💬" },
  { name: "AWS S3", desc: "File storage & backups", category: "Storage", status: "connected", lastSync: "2024-03-15 06:00", icon: "🗄️" },
  { name: "Shopify", desc: "E-commerce order sync", category: "E-Commerce", status: "disconnected", lastSync: "2024-03-10 12:00", icon: "🛒" },
  { name: "HubSpot", desc: "Marketing automation", category: "Marketing", status: "pending", lastSync: "—", icon: "📢" },
  { name: "Twilio", desc: "SMS notifications", category: "Communication", status: "disconnected", lastSync: "2024-02-28 15:00", icon: "📱" },
];

export default function IntegrationsPage() {
  const connected = integrations.filter((i) => i.status === "connected").length;
  return (
    <div className="space-y-6">
      <PageHeader title="Integrations" description={`${connected} of ${integrations.length} integrations active`} />

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
          <div><p className="text-xl font-bold text-gray-900">{connected}</p><p className="text-sm text-gray-500">Connected</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-3">
          <XCircle className="w-8 h-8 text-red-400" />
          <div><p className="text-xl font-bold text-gray-900">{integrations.filter((i) => i.status === "disconnected").length}</p><p className="text-sm text-gray-500">Disconnected</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-3">
          <Clock className="w-8 h-8 text-yellow-500" />
          <div><p className="text-xl font-bold text-gray-900">{integrations.filter((i) => i.status === "pending").length}</p><p className="text-sm text-gray-500">Pending Setup</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((i) => (
          <div key={i.name} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-blue-300 cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{i.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{i.name}</h3>
                  <p className="text-xs text-gray-500">{i.desc}</p>
                </div>
              </div>
              <StatusBadge status={i.status} />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span>{i.category}</span>
              <span>Last sync: {i.lastSync}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
