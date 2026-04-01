# BixoERP — Developer Guide

A complete onboarding reference for developers new to this project.

---

## Table of Contents

1. [What is BixoERP?](#1-what-is-bixoerp)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Repository Layout](#3-repository-layout)
4. [Backend Services](#4-backend-services)
5. [Frontend Apps](#5-frontend-apps)
6. [Infrastructure & Data Stores](#6-infrastructure--data-stores)
7. [How Services Communicate](#7-how-services-communicate)
8. [API Gateway (Kong)](#8-api-gateway-kong)
9. [Multi-Tenancy](#9-multi-tenancy)
10. [Security Model](#10-security-model)
11. [Local Development (Without Docker)](#11-local-development-without-docker)
12. [Running Everything with Docker](#12-running-everything-with-docker)
13. [Golden Rules](#13-golden-rules)
14. [Key Technology Decisions](#14-key-technology-decisions)

---

## 1. What is BixoERP?

BixoERP is a **multi-tenant, event-driven Enterprise Resource Planning (ERP) system**. It covers the full spectrum of business operations:

- **Finance** — General Ledger, Chart of Accounts, Invoicing
- **AP/AR** — Accounts Payable & Receivable, Payment Runs
- **HR** — Employees, Payroll, Leave Management
- **Inventory** — Stock, Warehouses, Movements
- **Procurement** — Purchase Orders, Vendors, Goods Receipt
- **Manufacturing** — Bill of Materials, Work Orders, Production
- **Sales** — Sales Orders, Customers, Quotes
- **Projects** — Projects, Tasks, Time Tracking
- **Reports** — Real-time dashboards and analytics
- **Workflow** — Approval flows and business rules
- **Files** — Document management (S3/MinIO)
- **Audit** — Compliance logs, searchable audit trail
- **Integrations** — Webhooks and external API connectors
- **Notifications** — Alerts, email, and push notifications

---

## 2. High-Level Architecture

```
Browser / Mobile
       │
       ▼
┌──────────────┐
│  Kong API     │  ← Single entry point for ALL external traffic
│  Gateway      │  ← JWT validation, routing, rate limiting
└──────┬───────┘
       │  HTTP
  ┌────┴────────────────────────────────────────────┐
  │            Backend Microservices (14 services)   │
  │                                                  │
  │  core  finance  hr  sales  inventory  ...        │
  └────┬────────────────────────────────────────────┘
       │
  ┌────┴─────────────────────────────────────────────┐
  │                   Infrastructure                  │
  │  PostgreSQL  Redis  Kafka  MongoDB  Elasticsearch │
  │  ClickHouse  MinIO  Vault                         │
  └──────────────────────────────────────────────────┘
```

**3 communication styles between services:**

| Style | When to use | Technology |
|---|---|---|
| **Async events** | Default for cross-domain side effects | Kafka |
| **Sync queries** | When you need an answer immediately | gRPC |
| **Direct DB** | Never — each service owns its own DB | ❌ Forbidden |

---

## 3. Repository Layout

```
bixoERP/
├── DOCKER_RUN.md              ← Full Docker setup guide
├── DEVELOPER_GUIDE.md         ← This file
└── erp-source/
    ├── docker-compose.yml     ← Application services compose file
    ├── rebuild-front.sh       ← Rebuilds frontend Docker images
    │
    ├── back/                  ← All backend code
    │   ├── README.md          ← Architecture overview + Golden Rules
    │   ├── LOCAL_DEV.md       ← Local dev setup guide
    │   ├── services/          ← 16 microservices (see §4)
    │   ├── proto/             ← Shared gRPC .proto definitions
    │   ├── events/            ← Kafka event contracts (JSON Schema)
    │   ├── gateway/           ← Kong API Gateway config (kong.yml)
    │   ├── libs/              ← Shared libraries (Go + TS)
    │   └── infra/
    │       ├── docker/        ← Infrastructure docker-compose.yml
    │       ├── helm/          ← Kubernetes Helm charts
    │       └── k8s/           ← Raw Kubernetes manifests
    │
    └── front/                 ← All frontend code (Turborepo monorepo)
        ├── apps/              ← 15 Next.js applications (one per domain)
        ├── packages/          ← Shared packages (ui, api-client, etc.)
        └── turbo.json         ← Turborepo pipeline configuration
```

---

## 4. Backend Services

All services live under `erp-source/back/services/`. Each is independently deployable with its own database.

### Service Directory

| Service | Port | Stack | Database | Domain |
|---|---|---|---|---|
| `core` | 3015 | TypeScript / NestJS | PostgreSQL + Redis | Auth, Users, Organizations, RBAC |
| `finance-svc` | 3001 | TypeScript / NestJS | PostgreSQL | General Ledger, Journal Entries, Invoices |
| `apar-svc` | 3002 | TypeScript / NestJS | PostgreSQL | Accounts Payable & Receivable |
| `hr-svc` | 3003 | TypeScript / NestJS | PostgreSQL | Employees, Payroll, Leave |
| `sales-svc` | 3004 | TypeScript / NestJS | PostgreSQL + Elasticsearch | Sales Orders, Customers, Quotes |
| `inventory-svc` | 3005 | **Go / Fiber** | PostgreSQL + Redis | Stock, Warehouses, Movements |
| `procurement-svc` | 3006 | **Java / Spring Boot** | PostgreSQL | POs, Vendors, Goods Receipt |
| `manufacturing-svc` | 3007 | **Java / Spring Boot** | PostgreSQL | BOMs, Work Orders |
| `project-svc` | 3008 | TypeScript / NestJS | PostgreSQL | Projects, Tasks, Time Tracking |
| `workflow-svc` | 3009 | TypeScript / NestJS | PostgreSQL | Approval Flows, Business Rules |
| `notification-svc` | 3010 | TypeScript / NestJS | MongoDB | Alerts, Email, Push |
| `files-svc` | 3011 | TypeScript / NestJS | S3/MinIO + PostgreSQL | Document Management |
| `integration-svc` | 3012 | TypeScript / NestJS | MongoDB | Webhooks, External APIs |
| `report-svc` | 3013 | **Python / FastAPI** | ClickHouse | Dashboards, Analytics |
| `audit-svc` | 3014 | **Go / Fiber** | Elasticsearch | Audit Logs, Compliance |
| `notification-web` | — | TypeScript / NestJS | — | Notification websocket gateway |

> **Note:** The project is polyglot — TypeScript (NestJS) is the default, but Go (Fiber) is used for high-throughput services (inventory, audit), Java (Spring Boot) for enterprise-heavy domains (procurement, manufacturing), and Python (FastAPI) for the analytics/reporting layer.

### Core Service — Key Responsibilities

`core` is the **auth and identity hub**. Every other service validates the JWT it issues. It manages:

- User registration, login, logout
- JWT access tokens (15 min TTL) + refresh tokens (30 day TTL)
- Role-Based Access Control (RBAC) — roles + permissions
- Two-Factor Authentication (TOTP)
- Social login (OAuth)
- Organization and org structure (departments, divisions, teams)
- User profiles and settings

### Architecture Pattern (NestJS services)

NestJS services follow **clean / hexagonal architecture**:

```
src/
├── api/                   ← HTTP layer (controllers, guards, pipes, DTOs)
├── application/           ← Use cases + ports (interfaces)
├── domain/                ← Entities, value objects, domain repos
└── infrastructure/        ← DB, Kafka, Redis, JWT implementations
```

Dependency direction: `api → application → domain ← infrastructure`

The domain has zero dependencies on frameworks. Infrastructure implements the domain's repository interfaces.

---

## 5. Frontend Apps

The frontend is a **Turborepo monorepo** under `erp-source/front/`. It builds 15 separate Next.js apps — one per ERP module — plus shared packages.

### Apps

| App | Port | Backs onto |
|---|---|---|
| `core` (main shell) | 3000 | core service (auth, org) |
| `hr` | 4003 | hr-svc |
| `finance` | 4001 | finance-svc |
| `apar` | 4002 | apar-svc |
| `inventory` | 4005 | inventory-svc |
| `procurement` | 4006 | procurement-svc |
| `manufacturing` | 4007 | manufacturing-svc |
| `sales` | 4004 | sales-svc |
| `projects` | 4008 | project-svc |
| `workflow` | 4009 | workflow-svc |
| `notifications` | 4010 | notification-svc |
| `files` | 4011 | files-svc |
| `reports` | 4013 | report-svc |
| `audit` | 4014 | audit-svc |
| `integrations` | 4012 | integration-svc |

### Shared Packages

| Package | Purpose |
|---|---|
| `@erp/ui` | Shared React component library (Tailwind CSS) |
| `@erp/api-client` | Type-safe API Gateway client |
| `@erp/shared` | Shared types, utils, and constants |
| `@erp/config` | Shared Next.js and Tailwind config factory |
| `@erp/shell` | Shared app shell components (nav, layout) |
| `@erp/icons` | Icon library |

### Frontend Tech Stack

- **Next.js** (App Router)
- **React** + **TypeScript**
- **Tailwind CSS**
- **Turborepo** for monorepo build pipeline

### Turborepo Pipeline

`turbo.json` defines the build order:

1. Packages build first (`^build` dependency)
2. Apps build after their package dependencies
3. `dev` tasks run in parallel with persistent watch mode

---

## 6. Infrastructure & Data Stores

All infrastructure is in `erp-source/back/infra/docker/docker-compose.yml`.

### Data Stores by Role

| Store | Use Case | Which Services |
|---|---|---|
| **PostgreSQL 16** | Primary transactional data | All NestJS/Java/Go services |
| **Redis** | Session cache, rate limiting, distributed locks | core, inventory-svc |
| **Kafka (Confluent 7.6)** | Async event bus | All services |
| **MongoDB** | Document storage (notifications, integrations) | notification-svc, integration-svc |
| **Elasticsearch** | Full-text search, audit log query | sales-svc, audit-svc |
| **ClickHouse** | OLAP analytics queries, reporting | report-svc |
| **MinIO** | S3-compatible object storage (files) | files-svc |

### Observability Stack (optional local)

| Tool | Port | Purpose |
|---|---|---|
| Kafka UI | 8080 | Browse Kafka topics |
| Prometheus | 9090 | Metrics scraping |
| Grafana | 3000 | Dashboards |
| Jaeger | 16686 | Distributed tracing |
| Loki | 3100 | Log aggregation |
| MinIO Console | 9002 | S3 bucket browser |

### PostgreSQL Setup

Postgres runs on port **5436** locally (mapped from 5432 inside Docker). The init scripts automatically create:
- Separate databases per service (e.g., `auth_db`, `finance_db`, `hr_db`)
- An `erp_app` role with the password `erp_app_password`

---

## 7. How Services Communicate

### Kafka (Async — Default)

Topics follow the naming convention: `erp.{domain}.{aggregate}.{event}`

Examples:
- `erp.finance.journal-entry.posted`
- `erp.sales.order.confirmed` → triggers inventory reservation
- `erp.procurement.goods-receipt.created` → triggers inventory update
- `erp.hr.payroll.processed` → triggers finance journal entry

All events share a common envelope schema (`back/events/envelope.schema.json`). Full topic registry: `back/events/README.md`.

**Outbox Pattern**: Services don't publish directly to Kafka. They write to an `outbox` table in the same DB transaction, then an `OutboxRelay` process reads and publishes. This guarantees no lost events.

**Consumers are idempotent**: Every Kafka consumer tracks `ProcessedEvent` IDs so duplicate delivery is safe.

### gRPC (Sync — Query Only)

Used when a service needs a real-time answer from another service. Proto files are in `back/proto/`.

Example — report-svc querying finance-svc:
```protobuf
service FinanceService {
  rpc GetAccountBalance (GetAccountBalanceRequest) returns (AccountBalanceResponse);
  rpc GetTrialBalance   (GetTrialBalanceRequest)   returns (TrialBalanceResponse);
  rpc GetPeriodStatus   (GetPeriodStatusRequest)   returns (PeriodStatusResponse);
}
```

### Key Cross-Service Flows

```
Sales Order Confirmed
  └─► erp.sales.order.confirmed (Kafka)
        └─► inventory-svc reserves stock
              └─► erp.inventory.stock.issued (Kafka)

Payroll Processed
  └─► erp.hr.payroll.processed (Kafka)
        └─► finance-svc creates journal entry

Goods Received (PO)
  └─► erp.procurement.goods-receipt.created (Kafka)
        └─► inventory-svc increases stock level
              └─► (if below reorder) erp.inventory.stock.below-reorder
                    └─► procurement-svc may create new PO
```

---

## 8. API Gateway (Kong)

Kong is the **single public-facing entry point**. No frontend app or external client calls a backend service directly. Kong handles:

- JWT validation
- Route matching
- (Potentially) rate limiting, request logging

### Route Map

| Path Prefix | Forwards to |
|---|---|
| `/api/v1/finance` | finance-svc:3001 |
| `/api/v1/apar` | apar-svc:3002 |
| `/api/v1/hr` | hr-svc:3003 |
| `/api/v1/sales` | sales-svc:3004 |
| `/api/v1/inventory` | inventory-svc:3005 |
| `/api/v1/procurement` | procurement-svc:3006 |
| `/api/v1/manufacturing` | manufacturing-svc:3007 |
| `/api/v1/projects` | project-svc:3008 |
| `/api/v1/workflow` | workflow-svc:3009 |
| `/api/v1/notifications` | notification-svc:3010 |

Config lives in `back/gateway/kong.yml`.

---

## 9. Multi-Tenancy

This is a **multi-tenant** system. Each customer/company is a "tenant".

- Every JWT contains a `tenant_id` claim
- Every service reads `tenant_id` **from the JWT only** — never from the request body (security rule)
- Database isolation is **schema-per-tenant** inside PostgreSQL

---

## 10. Security Model

| Concern | Approach |
|---|---|
| Authentication | JWT (issued by `core`) validated at Kong AND each service |
| Authorization | RBAC — roles + permissions stored in `core` |
| 2FA | TOTP (authenticator app) via `otplib` |
| Secrets | HashiCorp Vault — never hardcoded |
| Service-to-service | mTLS for all internal traffic |
| Tenant isolation | `tenant_id` from JWT only |
| Money/currency | `NUMERIC(19,4)` in PostgreSQL — never float |
| Password handling | `bcrypt` for hashing |

---

## 11. Local Development (Without Docker)

This runs only `core` + `hr-svc` + their frontends — the smallest useful slice.

### Prerequisites

- Node.js >= 20, npm >= 10.8.0
- Docker (for infra only — Postgres, Kafka, Redis)

### Step 1 — Start Infrastructure

```bash
cd erp-source/back/infra/docker
docker compose up -d postgres redis kafka zookeeper
```

Wait ~20 seconds for Postgres to initialize.

### Step 2 — Start Core Service (Auth) on port 3015

```bash
cd erp-source/back/services/core
cp .env.example .env
# Fix the DB password to match init script
sed -i '' 's/DB_PASSWORD=erp_secret/DB_PASSWORD=erp_app_password/' .env
npm install
npm run migration:run   # Creates tables via TypeORM migrations
npm run start:dev
```

### Step 3 — Start HR Service on port 3003

```bash
cd erp-source/back/services/hr-svc
cp .env.example .env
sed -i '' 's/DB_USERNAME=erp/DB_USERNAME=erp_app/' .env
sed -i '' 's/DB_PASSWORD=erp_dev_password/DB_PASSWORD=erp_app_password/' .env
npm install
npm run start:dev   # Uses synchronize:true — no migration:run needed
```

### Step 4 — Start Frontend

```bash
cd erp-source/front
npm install
npx turbo run dev --filter=core --filter=@erp/hr-app
```

### Access URLs

| What | URL |
|---|---|
| Core (main shell) | http://localhost:3000 |
| HR app | http://localhost:4003 |
| Core API | http://localhost:3015 |
| HR API | http://localhost:3003 |

> **Tip:** If the frontend still tries to hit Kong (port 8000), update the `next.config.ts` in `front/apps/core` and `front/apps/hr` to point directly at the backend ports.

---

## 12. Running Everything with Docker

For running the full system, read `DOCKER_RUN.md` at the repo root. Summary:

### Hardware Requirements (macOS with Colima)

Building 15 Next.js apps + 16 backend services requires significant resources:

```bash
colima start --memory 12 --cpu 6 --disk 60
```

### Quick Summary

```bash
# 1. Start infrastructure
cd erp-source/back/infra/docker
docker compose up -d postgres redis kafka zookeeper mongodb

# 2. Go back to root and build backend images
cd -
BUILDKIT_MAX_PARALLELISM=4 docker compose -f erp-source/docker-compose.yml build \
  core finance-svc apar-svc hr-svc ...

# 3. Build frontends (3 at a time to save memory)
BUILDKIT_MAX_PARALLELISM=3 docker compose -f erp-source/docker-compose.yml build \
  erp-frontend hr-frontend finance-frontend
# ... repeat for other groups

# 4. Start all services
docker compose -f erp-source/docker-compose.yml up -d

# 5. Run DB migrations (first time only)
docker compose -f erp-source/docker-compose.yml exec core npm run migration:run
```

---

## 13. Golden Rules

These are the architectural constraints enforced across all services:

1. **One service = one domain = one database** — no shared databases
2. **All external traffic through Kong only** — services never expose ports publicly
3. **No cross-service DB queries** — use Kafka or gRPC
4. **Kafka by default; gRPC only for sync queries**
5. **Outbox pattern** for Kafka event publishing (no dual-write problems)
6. **Every Kafka consumer must be idempotent**
7. **JWT validated at gateway AND at every service**
8. **Secrets from Vault** — never hardcoded (use `.env.example` as template)
9. **`tenant_id` from JWT only** — never trust the request body for this
10. **Money as `NUMERIC(19,4)`** — never float/double
11. **Analytics via ClickHouse** — never run heavy queries on operational DBs
12. **mTLS for all internal service-to-service traffic**

---

## 14. Key Technology Decisions

### Why Polyglot?

| Language | Why used here |
|---|---|
| TypeScript / NestJS | Team default — great DI, decorator-based, rapid dev |
| Go / Fiber | High-throughput services (inventory ops, audit writes) |
| Java / Spring Boot | Enterprise domains with complex business logic (procurement, manufacturing) |
| Python / FastAPI | Data/analytics layer — fits ecosystem (ClickHouse connectors, etc.) |

### Why ClickHouse for Reports?

ClickHouse is an OLAP (Online Analytical Processing) database optimized for aggregation queries over millions of rows — exactly what dashboards and financial reports need. The `report-svc` is a CQRS **read model** — it consumes Kafka events to keep its ClickHouse tables updated, so dashboards never hit operational databases.

### Why Outbox Pattern?

Without it, publishing a Kafka event and committing a DB transaction are two separate operations — either can fail independently, causing data inconsistency. The outbox pattern writes the event to a DB table in the same transaction as the business data, then a relay process reads and publishes it. This gives "at-least-once" delivery guarantees.

### Why MongoDB for Notifications/Integrations?

Notifications and integration webhook configs are schema-flexible — different notification types have different payloads. Document databases handle this better than rigid relational tables.

### Why Redis?

- **Session store** — fast JWT revocation lookup
- **Distributed cache** — avoids repeated DB calls for hot data
- **Distributed locks** — prevents race conditions in inventory operations

---

## Quick Reference

```bash
# Add a new backend service
# 1. Create services/your-svc/ with Dockerfile + .env.example
# 2. Add its database to infra/docker/init-scripts/postgres/
# 3. Add its route to gateway/kong.yml
# 4. Define its Kafka topics in events/your-domain/events.schema.json
# 5. Add gRPC proto if exposing sync queries: proto/your-domain/v1/

# Add a new frontend app
# 1. Create front/apps/your-app/ as a Next.js app
# 2. Add a Dockerfile.yourapp at erp-source/front/
# 3. Reference @erp/ui, @erp/api-client from packages/
# 4. Add dev/build to turbo.json pipeline if needed

# Common commands
npm run start:dev          # Start a NestJS service in watch mode
npm run migration:run      # Run TypeORM migrations (core, finance-svc, etc.)
npm run seed               # Seed initial data (core service)
npx turbo run dev          # Start all frontend apps in dev mode
npx turbo run build        # Build all frontend apps
```
