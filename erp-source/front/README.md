# ERP Frontend Monorepo

Enterprise Resource Planning system frontend built with Next.js, React, and Tailwind CSS.

## Architecture

```
frontendmono/
├── apps/
│   └── core/             # Main ERP Next.js application
├── packages/
│   ├── ui/               # Shared UI component library
│   ├── api-client/       # API Gateway client
│   └── shared/           # Shared types, utils, constants
├── turbo.json            # Turborepo pipeline config
└── package.json          # Root workspace config
```

## Services Covered

| Module | Backend Service | Description |
|--------|----------------|-------------|
| Finance | finance-svc | Chart of Accounts, Journal Entries, GL |
| AP/AR | apar-svc | Accounts Payable & Receivable |
| HR | hr-svc | Employees, Payroll, Leave |
| Inventory | inventory-svc | Stock, Warehouses, Movements |
| Procurement | procurement-svc | Purchase Orders, Vendors |
| Manufacturing | manufacturing-svc | BOMs, Work Orders, Production |
| Sales | sales-svc | Sales Orders, Customers, Quotes |
| Projects | project-svc | Projects, Tasks, Time Tracking |
| Reports | report-svc | Dashboards, Analytics |
| Notifications | notification-svc | Alerts, Email, Push |
| Workflow | workflow-svc | Approvals, Business Rules |
| Files | files-svc | Document Management |
| Audit | audit-svc | Audit Logs, Compliance |
| Integrations | integration-svc | Webhooks, External APIs |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

- `npm run dev` — Start all apps in development mode
- `npm run build` — Build all apps and packages
- `npm run lint` — Lint all apps and packages
- `npm run type-check` — TypeScript type checking
- `npm run clean` — Clean build artifacts
