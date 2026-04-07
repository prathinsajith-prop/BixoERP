'use client';

import { useState, useMemo } from 'react';
import PageHeader from '@/components/page-header';
import { Input } from '@erp/ui';

interface Module {
  key: string;
  label: string;
  description: string;
  category: string;
  color: string;
  ring: string;
  badge: string;
  icon: string;
  features: string[];
  dependencies: string[];
}

const MODULE_CATALOG: Module[] = [
  { key: 'finance', label: 'Finance', description: 'General ledger, chart of accounts, journal entries, and financial reporting.', category: 'Core', color: 'bg-emerald-50 dark:bg-emerald-900/30', ring: 'ring-emerald-200 dark:ring-emerald-800', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300', icon: '💰', features: ['General Ledger', 'Chart of Accounts', 'Journal Entries', 'Trial Balance', 'Financial Statements', 'Multi-currency Support'], dependencies: [] },
  { key: 'apar', label: 'AP / AR', description: 'Accounts payable and receivable, invoice management, and payment tracking.', category: 'Core', color: 'bg-blue-50 dark:bg-blue-900/30', ring: 'ring-blue-200 dark:ring-blue-800', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', icon: '🧾', features: ['Vendor Invoices', 'Customer Invoices', 'Payment Processing', 'Aging Reports', 'Credit Notes', 'Payment Reminders'], dependencies: ['finance'] },
  { key: 'hr', label: 'Human Resources', description: 'Employee records, onboarding, attendance, leave, and payroll integration.', category: 'Core', color: 'bg-violet-50 dark:bg-violet-900/30', ring: 'ring-violet-200 dark:ring-violet-800', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300', icon: '👥', features: ['Employee Directory', 'Onboarding Workflows', 'Attendance Tracking', 'Leave Management', 'Payroll Integration', 'Performance Reviews'], dependencies: [] },
  { key: 'inventory', label: 'Inventory', description: 'Stock management, warehousing, bin locations, and inventory valuation.', category: 'Operations', color: 'bg-amber-50 dark:bg-amber-900/30', ring: 'ring-amber-200 dark:ring-amber-800', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300', icon: '📦', features: ['Stock Tracking', 'Warehouse Management', 'Bin Locations', 'Stock Transfers', 'Inventory Valuation', 'Barcode Scanning'], dependencies: [] },
  { key: 'sales', label: 'Sales', description: 'Quotations, sales orders, customer management, and revenue analytics.', category: 'Operations', color: 'bg-pink-50 dark:bg-pink-900/30', ring: 'ring-pink-200 dark:ring-pink-800', badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300', icon: '📈', features: ['Quotations', 'Sales Orders', 'Customer CRM', 'Revenue Reports', 'Sales Pipeline', 'Commission Tracking'], dependencies: ['finance', 'inventory'] },
  { key: 'procurement', label: 'Procurement', description: 'Purchase requisitions, orders, vendor management, and spend analysis.', category: 'Operations', color: 'bg-cyan-50 dark:bg-cyan-900/30', ring: 'ring-cyan-200 dark:ring-cyan-800', badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300', icon: '🛒', features: ['Purchase Requisitions', 'Purchase Orders', 'Vendor Management', 'RFQ Process', 'Spend Analysis', 'Approval Workflows'], dependencies: ['finance', 'inventory'] },
  { key: 'manufacturing', label: 'Manufacturing', description: 'Bill of materials, work orders, production planning, and quality control.', category: 'Operations', color: 'bg-orange-50 dark:bg-orange-900/30', ring: 'ring-orange-200 dark:ring-orange-800', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300', icon: '🏭', features: ['Bill of Materials', 'Work Orders', 'Production Planning', 'Quality Control', 'Routing', 'Capacity Planning'], dependencies: ['inventory'] },
  { key: 'projects', label: 'Projects', description: 'Project planning, tasks, timesheets, milestones, and budget tracking.', category: 'Collaboration', color: 'bg-indigo-50 dark:bg-indigo-900/30', ring: 'ring-indigo-200 dark:ring-indigo-800', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300', icon: '📋', features: ['Project Planning', 'Task Management', 'Gantt Charts', 'Timesheets', 'Milestones', 'Budget Tracking'], dependencies: [] },
  { key: 'reports', label: 'Reports & Analytics', description: 'Custom dashboards, report builder, scheduled reports, and data visualization.', category: 'Intelligence', color: 'bg-teal-50 dark:bg-teal-900/30', ring: 'ring-teal-200 dark:ring-teal-800', badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300', icon: '📊', features: ['Dashboard Builder', 'Custom Reports', 'Scheduled Reports', 'Data Export', 'Pivot Tables', 'Chart Visualization'], dependencies: [] },
  { key: 'workflow', label: 'Workflow Engine', description: 'Approval chains, automated actions, conditional routing, and notifications.', category: 'Platform', color: 'bg-fuchsia-50 dark:bg-fuchsia-900/30', ring: 'ring-fuchsia-200 dark:ring-fuchsia-800', badge: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900 dark:text-fuchsia-300', icon: '⚙️', features: ['Approval Chains', 'Conditional Routing', 'Automated Actions', 'Email Triggers', 'Webhook Integration', 'SLA Tracking'], dependencies: [] },
  { key: 'notifications', label: 'Notifications', description: 'In-app, email, push, and SMS notification management and preferences.', category: 'Platform', color: 'bg-rose-50 dark:bg-rose-900/30', ring: 'ring-rose-200 dark:ring-rose-800', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300', icon: '🔔', features: ['In-app Alerts', 'Email Notifications', 'Push Notifications', 'SMS Alerts', 'Digest Emails', 'Notification Preferences'], dependencies: [] },
  { key: 'files', label: 'File Management', description: 'Document storage, version control, sharing, and preview capabilities.', category: 'Platform', color: 'bg-sky-50 dark:bg-sky-900/30', ring: 'ring-sky-200 dark:ring-sky-800', badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300', icon: '📁', features: ['File Upload', 'Version Control', 'File Sharing', 'Preview & Thumbnails', 'Folder Structure', 'Access Control'], dependencies: [] },
  { key: 'audit', label: 'Audit Trail', description: 'Comprehensive action logging, compliance tracking, and change history.', category: 'Governance', color: 'bg-stone-50 dark:bg-stone-900/30', ring: 'ring-stone-200 dark:ring-stone-800', badge: 'bg-stone-100 text-stone-700 dark:bg-stone-900 dark:text-stone-300', icon: '🔍', features: ['Action Logging', 'Change History', 'Compliance Reports', 'User Activity', 'Data Export', 'Retention Policies'], dependencies: [] },
  { key: 'integrations', label: 'Integrations', description: 'REST APIs, webhooks, third-party connectors, and data import/export.', category: 'Platform', color: 'bg-lime-50 dark:bg-lime-900/30', ring: 'ring-lime-200 dark:ring-lime-800', badge: 'bg-lime-100 text-lime-700 dark:bg-lime-900 dark:text-lime-300', icon: '🔗', features: ['REST API', 'Webhooks', 'OAuth Connectors', 'CSV Import/Export', 'Zapier Integration', 'Custom Middleware'], dependencies: [] },
  { key: 'budgeting', label: 'Budgeting', description: 'Budget planning, allocation, tracking, variance analysis, and forecasting.', category: 'Intelligence', color: 'bg-yellow-50 dark:bg-yellow-900/30', ring: 'ring-yellow-200 dark:ring-yellow-800', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300', icon: '💵', features: ['Budget Planning', 'Allocation', 'Variance Analysis', 'Forecasting', 'Approval Workflows', 'Multi-period Budgets'], dependencies: ['finance'] },
  { key: 'fixed-assets', label: 'Fixed Assets', description: 'Asset register, depreciation schedules, maintenance, and disposal tracking.', category: 'Core', color: 'bg-slate-50 dark:bg-slate-900/30', ring: 'ring-slate-200 dark:ring-slate-800', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300', icon: '🏢', features: ['Asset Register', 'Depreciation Schedules', 'Maintenance Tracking', 'Disposal Management', 'Barcode Tagging', 'Insurance Tracking'], dependencies: ['finance'] },
  { key: 'tax', label: 'Tax Management', description: 'Tax rules, compliance, e-invoicing, GST/VAT calculation, and filing.', category: 'Governance', color: 'bg-red-50 dark:bg-red-900/30', ring: 'ring-red-200 dark:ring-red-800', badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', icon: '🧮', features: ['Tax Rules Engine', 'GST/VAT Calculation', 'E-Invoicing', 'Tax Filing', 'Withholding Tax', 'Tax Reports'], dependencies: ['finance'] },
  { key: 'crm', label: 'CRM', description: 'Customer relationship management, leads, opportunities, and pipeline tracking.', category: 'Operations', color: 'bg-purple-50 dark:bg-purple-900/30', ring: 'ring-purple-200 dark:ring-purple-800', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300', icon: '🤝', features: ['Lead Management', 'Opportunity Tracking', 'Pipeline View', 'Contact Management', 'Email Integration', 'Activity Logging'], dependencies: ['sales'] },
  { key: 'ecommerce', label: 'E-Commerce', description: 'Online storefront, product catalog, cart, checkout, and order management.', category: 'Operations', color: 'bg-green-50 dark:bg-green-900/30', ring: 'ring-green-200 dark:ring-green-800', badge: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icon: '🛍️', features: ['Product Catalog', 'Shopping Cart', 'Checkout Flow', 'Order Management', 'Shipping Integration', 'Payment Gateway'], dependencies: ['sales', 'inventory'] },
  { key: 'fleet', label: 'Fleet Management', description: 'Vehicle tracking, maintenance schedules, fuel logs, and driver management.', category: 'Operations', color: 'bg-neutral-50 dark:bg-neutral-900/30', ring: 'ring-neutral-200 dark:ring-neutral-800', badge: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300', icon: '🚛', features: ['Vehicle Register', 'Maintenance Schedules', 'Fuel Tracking', 'Driver Management', 'Route Planning', 'Expense Tracking'], dependencies: [] },
];

const CATEGORIES = ['All', 'Core', 'Operations', 'Collaboration', 'Intelligence', 'Platform', 'Governance'];

function DepBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
      {active ? (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
      ) : (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
      )}
      {label}
    </span>
  );
}

function ModuleCard({ mod, active, activeModules, onToggle }: { mod: Module; active: boolean; activeModules: Set<string>; onToggle: (key: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const missingDeps = mod.dependencies.filter((d) => !activeModules.has(d));
  const depLabels = mod.dependencies.map((d) => MODULE_CATALOG.find((m) => m.key === d)?.label ?? d);

  return (
    <div className={`rounded-2xl ring-1 transition-all ${active ? `${mod.color} ${mod.ring}` : 'bg-white ring-gray-100 dark:bg-gray-800 dark:ring-gray-700'}`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{mod.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">{mod.label}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${mod.badge}`}>{mod.category}</span>
              </div>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{mod.description}</p>
            </div>
          </div>
          <button
            onClick={() => onToggle(mod.key)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${active ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {mod.dependencies.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Requires:</span>
            {mod.dependencies.map((d) => (
              <DepBadge key={d} label={MODULE_CATALOG.find((m) => m.key === d)?.label ?? d} active={activeModules.has(d)} />
            ))}
          </div>
        )}

        {!active && missingDeps.length > 0 && (
          <p className="mt-2 text-[10px] text-amber-600 dark:text-amber-400">
            ⚠ Activate {missingDeps.map((d) => MODULE_CATALOG.find((m) => m.key === d)?.label ?? d).join(', ')} first
          </p>
        )}

        <button onClick={() => setExpanded(!expanded)} className="mt-3 text-[10px] font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
          {expanded ? 'Hide Features ↑' : `View ${mod.features.length} Features ↓`}
        </button>

        {expanded && (
          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
            {mod.features.map((f) => (
              <li key={f} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                <svg className="h-3 w-3 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                {f}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatsBar({ activeModules, total }: { activeModules: number; total: number }) {
  const inactive = total - activeModules;
  const pct = total > 0 ? Math.round((activeModules / total) * 100) : 0;
  return (
    <div className="flex flex-wrap items-center gap-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase">Total</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
      </div>
      <div>
        <p className="text-xs font-medium text-emerald-500 uppercase">Active</p>
        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeModules}</p>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase">Inactive</p>
        <p className="text-2xl font-bold text-gray-400">{inactive}</p>
      </div>
      <div className="ml-auto hidden sm:block">
        <p className="text-xs font-medium text-gray-400 uppercase mb-1">Utilization</p>
        <div className="flex items-center gap-3">
          <div className="h-2 w-32 rounded-full bg-gray-100 dark:bg-gray-700">
            <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{pct}%</span>
        </div>
      </div>
    </div>
  );
}

export default function ModulesPage() {
  const [activeModules, setActiveModules] = useState<Set<string>>(new Set(['finance', 'hr', 'inventory', 'projects', 'workflow', 'notifications', 'files', 'audit', 'reports']));
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [confirmAction, setConfirmAction] = useState<{ key: string; action: 'activate' | 'deactivate' } | null>(null);

  const filtered = useMemo(() => {
    return MODULE_CATALOG.filter((m) => {
      if (search && !m.label.toLowerCase().includes(search.toLowerCase()) && !m.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (category !== 'All' && m.category !== category) return false;
      return true;
    });
  }, [search, category]);

  const handleToggle = (key: string) => {
    const isActive = activeModules.has(key);
    setConfirmAction({ key, action: isActive ? 'deactivate' : 'activate' });
  };

  const confirmToggle = () => {
    if (!confirmAction) return;
    setActiveModules((prev) => {
      const s = new Set(prev);
      if (confirmAction.action === 'activate') {
        s.add(confirmAction.key);
        const mod = MODULE_CATALOG.find((m) => m.key === confirmAction.key);
        mod?.dependencies.forEach((d) => s.add(d));
      } else {
        s.delete(confirmAction.key);
        MODULE_CATALOG.filter((m) => m.dependencies.includes(confirmAction.key)).forEach((m) => s.delete(m.key));
      }
      return s;
    });
    setConfirmAction(null);
  };

  const activateAll = () => setActiveModules(new Set(MODULE_CATALOG.map((m) => m.key)));
  const deactivateAll = () => setActiveModules(new Set());

  const confirmMod = confirmAction ? MODULE_CATALOG.find((m) => m.key === confirmAction.key) : null;
  const affectedMods = confirmAction
    ? confirmAction.action === 'activate'
      ? (confirmMod?.dependencies.filter((d) => !activeModules.has(d)).map((d) => MODULE_CATALOG.find((m) => m.key === d)?.label ?? d) ?? [])
      : MODULE_CATALOG.filter((m) => m.dependencies.includes(confirmAction.key) && activeModules.has(m.key)).map((m) => m.label)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Modules" subtitle="Configure available modules" />
      <div className="mb-6 flex justify-end gap-2">
        <button onClick={activateAll} className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/30">Activate All</button>
        <button onClick={deactivateAll} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700">Deactivate All</button>
      </div>

      <StatsBar activeModules={activeModules.size} total={MODULE_CATALOG.length} />

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search modules..."
          className="sm:w-64"
        />
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)} className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${category === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((mod) => (
          <ModuleCard key={mod.key} mod={mod} active={activeModules.has(mod.key)} activeModules={activeModules} onToggle={handleToggle} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl bg-white py-16 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No modules match your search.</p>
        </div>
      )}

      {/* Confirmation dialog */}
      {confirmAction && confirmMod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {confirmAction.action === 'activate' ? 'Activate' : 'Deactivate'} {confirmMod.label}?
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {confirmAction.action === 'activate'
                ? `This will enable the ${confirmMod.label} module and all its features for your organization.`
                : `This will disable the ${confirmMod.label} module. Any data will be preserved but features will be inaccessible.`}
            </p>
            {affectedMods.length > 0 && (
              <div className="mt-3 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/30">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  {confirmAction.action === 'activate'
                    ? `Will also activate dependencies: ${affectedMods.join(', ')}`
                    : `Will also deactivate dependent modules: ${affectedMods.join(', ')}`}
                </p>
              </div>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setConfirmAction(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancel</button>
              <button
                onClick={confirmToggle}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${confirmAction.action === 'activate' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {confirmAction.action === 'activate' ? 'Activate' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
