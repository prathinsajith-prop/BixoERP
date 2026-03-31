// ERP Module definitions — maps to the 14 backend microservices

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  children?: NavItem[];
}

export interface ModuleConfig {
  id: string;
  name: string;
  description: string;
  basePath: string;
  icon: string;
  service: string;
  tier: "critical" | "standard" | "best-effort";
  nav: NavItem[];
}

export const modules: ModuleConfig[] = [
  {
    id: "finance",
    name: "Finance",
    description: "General Ledger, Chart of Accounts, Journal Entries, Multi-Currency, Tax, Budgeting",
    basePath: "/finance",
    icon: "Banknote",
    service: "finance-svc",
    tier: "critical",
    nav: [
      { label: "Dashboard", href: "/finance", icon: "LayoutDashboard" },
      { label: "Chart of Accounts", href: "/finance/accounts", icon: "List" },
      { label: "Journal Entries", href: "/finance/journals", icon: "BookOpen" },
      { label: "Fiscal Periods", href: "/finance/periods", icon: "Calendar" },
      { label: "Budgets", href: "/finance/budgets", icon: "PiggyBank" },
      { label: "Tax Management", href: "/finance/tax", icon: "Receipt" },
    ],
  },
  {
    id: "apar",
    name: "AP / AR",
    description: "Accounts Payable, Accounts Receivable, Invoices, Payments, Aging",
    basePath: "/apar",
    icon: "ArrowLeftRight",
    service: "apar-svc",
    tier: "critical",
    nav: [
      { label: "Dashboard", href: "/apar", icon: "LayoutDashboard" },
      { label: "Invoices", href: "/apar/invoices", icon: "FileText" },
      { label: "Payments", href: "/apar/payments", icon: "CreditCard" },
      { label: "Aging Report", href: "/apar/aging", icon: "Clock" },
      { label: "Credit Notes", href: "/apar/credit-notes", icon: "FileX" },
    ],
  },
  {
    id: "hr",
    name: "Human Resources",
    description: "Employees, Departments, Payroll, Leave Management",
    basePath: "/hr",
    icon: "Users",
    service: "hr-svc",
    tier: "standard",
    nav: [
      { label: "Dashboard", href: "/hr", icon: "LayoutDashboard" },
      { label: "Employees", href: "/hr/employees", icon: "Users" },
      { label: "Departments", href: "/hr/departments", icon: "Building2" },
      { label: "Payroll", href: "/hr/payroll", icon: "Banknote" },
      { label: "Leave Requests", href: "/hr/leave", icon: "CalendarOff" },
    ],
  },
  {
    id: "inventory",
    name: "Inventory",
    description: "Stock Levels, Warehouses, Stock Movements, Reorder Management",
    basePath: "/inventory",
    icon: "Package",
    service: "inventory-svc",
    tier: "critical",
    nav: [
      { label: "Dashboard", href: "/inventory", icon: "LayoutDashboard" },
      { label: "Items", href: "/inventory/items", icon: "Package" },
      { label: "Warehouses", href: "/inventory/warehouses", icon: "Warehouse" },
      { label: "Stock Levels", href: "/inventory/stock", icon: "BarChart3" },
      { label: "Movements", href: "/inventory/movements", icon: "ArrowRightLeft" },
    ],
  },
  {
    id: "procurement",
    name: "Procurement",
    description: "Purchase Orders, Vendors, 3-Way Matching",
    basePath: "/procurement",
    icon: "ShoppingCart",
    service: "procurement-svc",
    tier: "standard",
    nav: [
      { label: "Dashboard", href: "/procurement", icon: "LayoutDashboard" },
      { label: "Purchase Orders", href: "/procurement/orders", icon: "ClipboardList" },
      { label: "Vendors", href: "/procurement/vendors", icon: "Truck" },
      { label: "Receiving", href: "/procurement/receiving", icon: "PackageCheck" },
    ],
  },
  {
    id: "manufacturing",
    name: "Manufacturing",
    description: "Bills of Materials, Work Orders, Production Tracking",
    basePath: "/manufacturing",
    icon: "Factory",
    service: "manufacturing-svc",
    tier: "standard",
    nav: [
      { label: "Dashboard", href: "/manufacturing", icon: "LayoutDashboard" },
      { label: "Bills of Materials", href: "/manufacturing/bom", icon: "Layers" },
      { label: "Work Orders", href: "/manufacturing/work-orders", icon: "ClipboardList" },
      { label: "Production", href: "/manufacturing/production", icon: "Factory" },
    ],
  },
  {
    id: "sales",
    name: "Sales",
    description: "Sales Orders, Customers, Quotes, Pricing",
    basePath: "/sales",
    icon: "TrendingUp",
    service: "sales-svc",
    tier: "critical",
    nav: [
      { label: "Dashboard", href: "/sales", icon: "LayoutDashboard" },
      { label: "Orders", href: "/sales/orders", icon: "ShoppingBag" },
      { label: "Customers", href: "/sales/customers", icon: "Users" },
      { label: "Quotes", href: "/sales/quotes", icon: "FileText" },
    ],
  },
  {
    id: "projects",
    name: "Projects",
    description: "Project Management, Tasks, Time Tracking, Budgets",
    basePath: "/projects",
    icon: "FolderKanban",
    service: "project-svc",
    tier: "standard",
    nav: [
      { label: "Dashboard", href: "/projects", icon: "LayoutDashboard" },
      { label: "All Projects", href: "/projects/list", icon: "FolderKanban" },
      { label: "Tasks", href: "/projects/tasks", icon: "CheckSquare" },
      { label: "Time Tracking", href: "/projects/time", icon: "Timer" },
    ],
  },
  {
    id: "reports",
    name: "Reports",
    description: "Dashboards, Analytics, Custom Reports",
    basePath: "/reports",
    icon: "BarChart3",
    service: "report-svc",
    tier: "best-effort",
    nav: [
      { label: "Dashboard", href: "/reports", icon: "LayoutDashboard" },
      { label: "Financial Reports", href: "/reports/financial", icon: "Banknote" },
      { label: "Inventory Reports", href: "/reports/inventory", icon: "Package" },
      { label: "Sales Reports", href: "/reports/sales", icon: "TrendingUp" },
      { label: "HR Reports", href: "/reports/hr", icon: "Users" },
    ],
  },
  {
    id: "workflow",
    name: "Workflow",
    description: "Approval Workflows, Business Rules Engine",
    basePath: "/workflow",
    icon: "GitBranch",
    service: "workflow-svc",
    tier: "standard",
    nav: [
      { label: "Pending Approvals", href: "/workflow", icon: "Clock" },
      { label: "My Requests", href: "/workflow/my-requests", icon: "Send" },
      { label: "Workflow Rules", href: "/workflow/rules", icon: "Settings" },
    ],
  },
  {
    id: "notifications",
    name: "Notifications",
    description: "Alerts, Email Templates, Push Notifications",
    basePath: "/notifications",
    icon: "Bell",
    service: "notification-svc",
    tier: "best-effort",
    nav: [
      { label: "All Notifications", href: "/notifications", icon: "Bell" },
      { label: "Settings", href: "/notifications/settings", icon: "Settings" },
    ],
  },
  {
    id: "files",
    name: "Files",
    description: "Document Management, File Storage",
    basePath: "/files",
    icon: "FolderOpen",
    service: "files-svc",
    tier: "standard",
    nav: [
      { label: "All Files", href: "/files", icon: "FolderOpen" },
      { label: "Upload", href: "/files/upload", icon: "Upload" },
    ],
  },
  {
    id: "audit",
    name: "Audit",
    description: "Audit Logs, Activity History, Compliance",
    basePath: "/audit",
    icon: "Shield",
    service: "audit-svc",
    tier: "best-effort",
    nav: [
      { label: "Audit Log", href: "/audit", icon: "Shield" },
      { label: "Activity", href: "/audit/activity", icon: "Activity" },
    ],
  },
  {
    id: "integrations",
    name: "Integrations",
    description: "Webhooks, External APIs, Data Sync",
    basePath: "/integrations",
    icon: "Plug",
    service: "integration-svc",
    tier: "standard",
    nav: [
      { label: "Webhooks", href: "/integrations", icon: "Plug" },
      { label: "API Keys", href: "/integrations/api-keys", icon: "Key" },
      { label: "Connections", href: "/integrations/connections", icon: "Link" },
    ],
  },
];

export const getModule = (id: string): ModuleConfig | undefined =>
  modules.find((m) => m.id === id);

export const getModuleByPath = (path: string): ModuleConfig | undefined =>
  modules.find((m) => path.startsWith(m.basePath));
