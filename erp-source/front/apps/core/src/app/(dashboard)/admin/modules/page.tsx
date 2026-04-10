'use client';

import { useState, useMemo } from 'react';
import { PageHeader, Stats, Modal, Button, Input, EmptyState, Card } from '@erp/ui';

interface Module {
  key: string;
  label: string;
  description: string;
  category: string;
  gradient: string;
  iconPath: string;
  features: string[];
  dependencies: string[];
}

const MODULE_CATALOG: Module[] = [
  { key: 'finance', label: 'Finance', description: 'General ledger, chart of accounts, journal entries, and financial reporting.', category: 'Core', gradient: 'from-emerald-500 to-teal-600', iconPath: 'M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z', features: ['General Ledger', 'Chart of Accounts', 'Journal Entries', 'Trial Balance', 'Financial Statements', 'Multi-currency'], dependencies: [] },
  { key: 'apar', label: 'AP / AR', description: 'Accounts payable and receivable, invoice management, and payment tracking.', category: 'Core', gradient: 'from-blue-500 to-indigo-600', iconPath: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25', features: ['Vendor Invoices', 'Customer Invoices', 'Payment Processing', 'Aging Reports', 'Credit Notes', 'Payment Reminders'], dependencies: ['finance'] },
  { key: 'hr', label: 'Human Resources', description: 'Employee records, onboarding, attendance, leave, and payroll integration.', category: 'Core', gradient: 'from-violet-500 to-purple-600', iconPath: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z', features: ['Employee Directory', 'Onboarding Workflows', 'Attendance', 'Leave Management', 'Payroll Integration', 'Performance Reviews'], dependencies: [] },
  { key: 'inventory', label: 'Inventory', description: 'Stock management, warehousing, bin locations, and inventory valuation.', category: 'Operations', gradient: 'from-amber-500 to-orange-600', iconPath: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z', features: ['Stock Tracking', 'Warehouse Management', 'Bin Locations', 'Stock Transfers', 'Inventory Valuation', 'Barcode Scanning'], dependencies: [] },
  { key: 'sales', label: 'Sales', description: 'Quotations, sales orders, customer management, and revenue analytics.', category: 'Operations', gradient: 'from-rose-500 to-pink-600', iconPath: 'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941', features: ['Quotations', 'Sales Orders', 'Customer CRM', 'Revenue Reports', 'Sales Pipeline', 'Commission Tracking'], dependencies: ['finance', 'inventory'] },
  { key: 'procurement', label: 'Procurement', description: 'Purchase requisitions, orders, vendor management, and spend analysis.', category: 'Operations', gradient: 'from-cyan-500 to-sky-600', iconPath: 'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z', features: ['Purchase Requisitions', 'Purchase Orders', 'Vendor Management', 'RFQ Process', 'Spend Analysis', 'Approval Workflows'], dependencies: ['finance', 'inventory'] },
  { key: 'manufacturing', label: 'Manufacturing', description: 'Bill of materials, work orders, production planning, and quality control.', category: 'Operations', gradient: 'from-orange-500 to-red-600', iconPath: 'M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z', features: ['Bill of Materials', 'Work Orders', 'Production Planning', 'Quality Control', 'Routing', 'Capacity Planning'], dependencies: ['inventory'] },
  { key: 'projects', label: 'Projects', description: 'Project planning, tasks, timesheets, milestones, and budget tracking.', category: 'Collaboration', gradient: 'from-indigo-500 to-blue-600', iconPath: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25', features: ['Project Planning', 'Task Management', 'Gantt Charts', 'Timesheets', 'Milestones', 'Budget Tracking'], dependencies: [] },
  { key: 'reports', label: 'Reports & Analytics', description: 'Custom dashboards, report builder, scheduled reports, and data visualization.', category: 'Intelligence', gradient: 'from-teal-500 to-green-600', iconPath: 'M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6', features: ['Dashboard Builder', 'Custom Reports', 'Scheduled Reports', 'Data Export', 'Pivot Tables', 'Chart Visualization'], dependencies: [] },
  { key: 'workflow', label: 'Workflow Engine', description: 'Approval chains, automated actions, conditional routing, and notifications.', category: 'Platform', gradient: 'from-fuchsia-500 to-purple-600', iconPath: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z', features: ['Approval Chains', 'Conditional Routing', 'Automated Actions', 'Email Triggers', 'Webhook Integration', 'SLA Tracking'], dependencies: [] },
  { key: 'notifications', label: 'Notifications', description: 'In-app, email, push, and SMS notification management and preferences.', category: 'Platform', gradient: 'from-rose-500 to-red-600', iconPath: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0', features: ['In-app Alerts', 'Email Notifications', 'Push Notifications', 'SMS Alerts', 'Digest Emails', 'Notification Preferences'], dependencies: [] },
  { key: 'files', label: 'File Management', description: 'Document storage, version control, sharing, and preview capabilities.', category: 'Platform', gradient: 'from-sky-500 to-blue-600', iconPath: 'M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z', features: ['File Upload', 'Version Control', 'File Sharing', 'Preview & Thumbnails', 'Folder Structure', 'Access Control'], dependencies: [] },
  { key: 'audit', label: 'Audit Trail', description: 'Comprehensive action logging, compliance tracking, and change history.', category: 'Governance', gradient: 'from-slate-500 to-gray-600', iconPath: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z', features: ['Action Logging', 'Change History', 'Compliance Reports', 'User Activity', 'Data Export', 'Retention Policies'], dependencies: [] },
  { key: 'integrations', label: 'Integrations', description: 'REST APIs, webhooks, third-party connectors, and data import/export.', category: 'Platform', gradient: 'from-lime-500 to-green-600', iconPath: 'M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244', features: ['REST API', 'Webhooks', 'OAuth Connectors', 'CSV Import/Export', 'Zapier Integration', 'Custom Middleware'], dependencies: [] },
  { key: 'budgeting', label: 'Budgeting', description: 'Budget planning, allocation, tracking, variance analysis, and forecasting.', category: 'Intelligence', gradient: 'from-yellow-500 to-amber-600', iconPath: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75', features: ['Budget Planning', 'Allocation', 'Variance Analysis', 'Forecasting', 'Approval Workflows', 'Multi-period Budgets'], dependencies: ['finance'] },
  { key: 'fixed-assets', label: 'Fixed Assets', description: 'Asset register, depreciation schedules, maintenance, and disposal tracking.', category: 'Core', gradient: 'from-stone-500 to-slate-600', iconPath: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21', features: ['Asset Register', 'Depreciation Schedules', 'Maintenance Tracking', 'Disposal Management', 'Barcode Tagging', 'Insurance Tracking'], dependencies: ['finance'] },
  { key: 'tax', label: 'Tax Management', description: 'Tax rules, compliance, e-invoicing, GST/VAT calculation, and filing.', category: 'Governance', gradient: 'from-red-500 to-rose-600', iconPath: 'M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.548 4.5 4.58V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.58c0-1.033-.807-1.88-1.907-2.008A48.585 48.585 0 0012 2.25z', features: ['Tax Rules Engine', 'GST/VAT Calculation', 'E-Invoicing', 'Tax Filing', 'Withholding Tax', 'Tax Reports'], dependencies: ['finance'] },
  { key: 'crm', label: 'CRM', description: 'Customer relationship management, leads, opportunities, and pipeline tracking.', category: 'Operations', gradient: 'from-purple-500 to-indigo-600', iconPath: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z', features: ['Lead Management', 'Opportunity Tracking', 'Pipeline View', 'Contact Management', 'Email Integration', 'Activity Logging'], dependencies: ['sales'] },
  { key: 'ecommerce', label: 'E-Commerce', description: 'Online storefront, product catalog, cart, checkout, and order management.', category: 'Operations', gradient: 'from-green-500 to-emerald-600', iconPath: 'M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z', features: ['Product Catalog', 'Shopping Cart', 'Checkout Flow', 'Order Management', 'Shipping Integration', 'Payment Gateway'], dependencies: ['sales', 'inventory'] },
  { key: 'fleet', label: 'Fleet Management', description: 'Vehicle tracking, maintenance schedules, fuel logs, and driver management.', category: 'Operations', gradient: 'from-neutral-500 to-stone-600', iconPath: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12', features: ['Vehicle Register', 'Maintenance Schedules', 'Fuel Tracking', 'Driver Management', 'Route Planning', 'Expense Tracking'], dependencies: [] },
];

const CATEGORIES = ['All', 'Core', 'Operations', 'Collaboration', 'Intelligence', 'Platform', 'Governance'];

const DEFAULT_ACTIVE = new Set(['finance', 'hr', 'inventory', 'projects', 'workflow', 'notifications', 'files', 'audit', 'reports']);

/* ── Module icon ── */
function ModuleIcon({ path, gradient, size = 'md' }: { path: string; gradient: string; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const icon = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  return (
    <span className={`flex ${dim} shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm`}>
      <svg className={icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
      </svg>
    </span>
  );
}

/* ── Toggle switch ── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--gogo-primary)] focus:ring-offset-2 ${checked ? 'bg-[var(--gogo-primary)]' : 'bg-[var(--gogo-divider)]'}`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

/* ── Category pill ── */
function CategoryPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${active ? 'text-white shadow-sm' : 'bg-[var(--gogo-grey-100)] text-[var(--gogo-text-secondary)] hover:bg-[var(--gogo-divider)]'}`}
      style={active ? { backgroundColor: 'var(--gogo-primary)' } : undefined}
    >
      {label}
    </button>
  );
}

/* ── Module card ── */
function ModuleCard({ mod, active, activeModules, onToggle }: {
  mod: Module; active: boolean; activeModules: Set<string>; onToggle: (key: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const missingDeps = mod.dependencies.filter((d) => !activeModules.has(d));

  return (
    <Card className={`transition-shadow ${active ? 'shadow-[var(--shadow-hover)]' : ''}`}>
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <ModuleIcon path={mod.iconPath} gradient={mod.gradient} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--gogo-text-primary)' }}>
                    {mod.label}
                  </p>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--gogo-primary) 10%, transparent)', color: 'var(--gogo-primary-dark)' }}
                  >
                    {mod.category}
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--gogo-text-secondary)' }}>
                  {mod.description}
                </p>
              </div>
              <Toggle checked={active} onChange={() => onToggle(mod.key)} />
            </div>
          </div>
        </div>

        {/* Dependencies */}
        {mod.dependencies.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t pt-3" style={{ borderColor: 'var(--gogo-divider)' }}>
            <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--gogo-text-secondary)' }}>Requires</span>
            {mod.dependencies.map((d) => {
              const depMod = MODULE_CATALOG.find((m) => m.key === d);
              const depActive = activeModules.has(d);
              return (
                <span
                  key={d}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${depActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-[var(--gogo-grey-100)] text-[var(--gogo-text-secondary)]'}`}
                >
                  {depActive ? (
                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  ) : (
                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                  )}
                  {depMod?.label ?? d}
                </span>
              );
            })}
          </div>
        )}

        {/* Missing dep warning */}
        {!active && missingDeps.length > 0 && (
          <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            Activate {missingDeps.map((d) => MODULE_CATALOG.find((m) => m.key === d)?.label ?? d).join(', ')} first
          </p>
        )}

        {/* Feature toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-[11px] font-medium transition-colors hover:opacity-80"
          style={{ color: 'var(--gogo-primary)' }}
        >
          <svg className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
          {expanded ? 'Hide features' : `${mod.features.length} features`}
        </button>

        {expanded && (
          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
            {mod.features.map((f) => (
              <li key={f} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--gogo-text-secondary)' }}>
                <svg className="h-3 w-3 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                {f}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

export default function ModulesPage() {
  const [activeModules, setActiveModules] = useState<Set<string>>(new Set(DEFAULT_ACTIVE));
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [confirmAction, setConfirmAction] = useState<{ key: string; action: 'activate' | 'deactivate' } | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return MODULE_CATALOG.filter((m) => {
      if (q && !m.label.toLowerCase().includes(q) && !m.description.toLowerCase().includes(q)) return false;
      if (category !== 'All' && m.category !== category) return false;
      return true;
    });
  }, [search, category]);

  const handleToggle = (key: string) => {
    setConfirmAction({ key, action: activeModules.has(key) ? 'deactivate' : 'activate' });
  };

  const confirmToggle = () => {
    if (!confirmAction) return;
    setActiveModules((prev) => {
      const s = new Set(prev);
      if (confirmAction.action === 'activate') {
        s.add(confirmAction.key);
        MODULE_CATALOG.find((m) => m.key === confirmAction.key)?.dependencies.forEach((d) => s.add(d));
      } else {
        s.delete(confirmAction.key);
        MODULE_CATALOG.filter((m) => m.dependencies.includes(confirmAction.key)).forEach((m) => s.delete(m.key));
      }
      return s;
    });
    setConfirmAction(null);
  };

  const confirmMod = confirmAction ? MODULE_CATALOG.find((m) => m.key === confirmAction.key) : null;
  const affectedMods = confirmAction && confirmMod
    ? confirmAction.action === 'activate'
      ? confirmMod.dependencies.filter((d) => !activeModules.has(d)).map((d) => MODULE_CATALOG.find((m) => m.key === d)?.label ?? d)
      : MODULE_CATALOG.filter((m) => m.dependencies.includes(confirmAction.key) && activeModules.has(m.key)).map((m) => m.label)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modules"
        description="Enable or disable modules for your organisation. Dependencies are activated automatically."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setActiveModules(new Set())}>
              Deactivate All
            </Button>
            <Button size="sm" onClick={() => setActiveModules(new Set(MODULE_CATALOG.map((m) => m.key)))}>
              Activate All
            </Button>
          </div>
        }
      />

      <Stats
        columns={3}
        metrics={[
          {
            label: 'Total Modules',
            value: MODULE_CATALOG.length,
            color: 'info',
            icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm0 9.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zm9.75-9.75A2.25 2.25 0 0115.75 3.75H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zm0 9.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>,
          },
          {
            label: 'Active',
            value: activeModules.size,
            color: 'success',
            icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
          },
          {
            label: 'Inactive',
            value: MODULE_CATALOG.length - activeModules.size,
            color: 'warning',
            icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>,
          },
        ]}
      />

      {/* Search + category filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-72">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center" style={{ color: 'var(--gogo-text-secondary)' }}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          </span>
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search modules…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <CategoryPill key={cat} label={cat} active={category === cat} onClick={() => setCategory(cat)} />
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((mod) => (
            <ModuleCard key={mod.key} mod={mod} active={activeModules.has(mod.key)} activeModules={activeModules} onToggle={handleToggle} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No modules found"
          description="Try adjusting your search or category filter."
          icon={<svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>}
        />
      )}

      {/* Confirmation modal */}
      <Modal
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={confirmAction ? `${confirmAction.action === 'activate' ? 'Activate' : 'Deactivate'} ${confirmMod?.label}?` : ''}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button
              variant={confirmAction?.action === 'activate' ? 'primary' : 'danger'}
              onClick={confirmToggle}
            >
              {confirmAction?.action === 'activate' ? 'Activate' : 'Deactivate'}
            </Button>
          </>
        }
      >
        {confirmMod && confirmAction && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <ModuleIcon path={confirmMod.iconPath} gradient={confirmMod.gradient} size="sm" />
              <p className="text-sm" style={{ color: 'var(--gogo-text-secondary)' }}>
                {confirmAction.action === 'activate'
                  ? `This will enable the ${confirmMod.label} module and all its features.`
                  : `This will disable the ${confirmMod.label} module. Data will be preserved but features will be inaccessible.`}
              </p>
            </div>
            {affectedMods.length > 0 && (
              <div className="rounded-lg p-3" style={{ backgroundColor: 'color-mix(in srgb, var(--gogo-primary) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--gogo-primary) 20%, transparent)' }}>
                <p className="text-xs font-medium" style={{ color: 'var(--gogo-primary-dark)' }}>
                  {confirmAction.action === 'activate'
                    ? `Will also activate: ${affectedMods.join(', ')}`
                    : `Will also deactivate: ${affectedMods.join(', ')}`}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
