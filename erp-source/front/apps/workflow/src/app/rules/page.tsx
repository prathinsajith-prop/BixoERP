"use client";

import { Plus, GitBranch } from "lucide-react";
import { PageHeader, StatusBadge, ActionButtons, type ActionButtonItem } from "@erp/ui";

const rules = [
  { id: 1, name: "PO Approval — Under $5K", trigger: "Purchase Order Created", condition: "Amount < $5,000", action: "Auto-approve → Notify requester", status: "active" },
  { id: 2, name: "PO Approval — $5K–$25K", trigger: "Purchase Order Created", condition: "$5,000 ≤ Amount < $25,000", action: "Route to Department Manager", status: "active" },
  { id: 3, name: "PO Approval — Over $25K", trigger: "Purchase Order Created", condition: "Amount ≥ $25,000", action: "Route to CFO → Then CEO", status: "active" },
  { id: 4, name: "Leave Approval", trigger: "Leave Request Submitted", condition: "Duration ≤ 5 days", action: "Route to Direct Manager", status: "active" },
  { id: 5, name: "Extended Leave", trigger: "Leave Request Submitted", condition: "Duration > 5 days", action: "Route to Manager → Then HR Director", status: "active" },
  { id: 6, name: "Expense Auto-Approve", trigger: "Expense Report Submitted", condition: "Amount < $500 & within policy", action: "Auto-approve", status: "active" },
  { id: 7, name: "Vendor Onboarding", trigger: "New Vendor Request", condition: "Always", action: "Route to Procurement Manager → Then Finance", status: "draft" },
];

const pageActions: ActionButtonItem[] = [
  { key: "create", label: "New Rule", icon: <Plus className="h-3.5 w-3.5" />, variant: "primary", size: "sm", onClick: () => { } },
];

export default function RulesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Approval Rules"
        description="Configure automated workflow routing"
        actions={<ActionButtons actions={pageActions} />}
      />

      <div className="space-y-3">
        {rules.map((r) => (
          <div key={r.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-blue-300 cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <GitBranch className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">{r.name}</h3>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="mt-1 space-y-0.5 text-xs text-gray-500">
                    <p><span className="font-medium text-gray-600">Trigger:</span> {r.trigger}</p>
                    <p><span className="font-medium text-gray-600">Condition:</span> {r.condition}</p>
                    <p><span className="font-medium text-gray-600">Action:</span> {r.action}</p>
                  </div>
                </div>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
