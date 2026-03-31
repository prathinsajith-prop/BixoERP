# ERP Monorepo

Multi-tenant, event-driven ERP system built as 14 microservices.

## Architecture

- **Microservices** — 14 domain services, independently deployable
- **Event-Driven** — async communication via Kafka
- **Multi-Tenant** — schema-per-tenant isolation
- **API Gateway** — Kong as the single entry point

## Services

| Service | Stack | Database |
|---|---|---|
| finance-svc | TypeScript / NestJS | PostgreSQL |
| apar-svc | TypeScript / NestJS | PostgreSQL |
| hr-svc | TypeScript / NestJS | PostgreSQL |
| inventory-svc | Go / Fiber | PostgreSQL + Redis |
| procurement-svc | Java / Spring Boot | PostgreSQL |
| manufacturing-svc | Java / Spring Boot | PostgreSQL |
| sales-svc | TypeScript / NestJS | PostgreSQL + Elasticsearch |
| project-svc | TypeScript / NestJS | PostgreSQL |
| report-svc | Python / FastAPI | ClickHouse |
| notification-svc | TypeScript / NestJS | MongoDB |
| workflow-svc | TypeScript / NestJS | PostgreSQL |
| files-svc | TypeScript / NestJS | S3/MinIO + PostgreSQL |
| audit-svc | Go / Fiber | Elasticsearch |
| integration-svc | TypeScript / NestJS | MongoDB |

## Directory Structure

```
mono/
├── services/           # All 14 microservices
├── proto/              # Shared gRPC proto definitions
├── events/             # Shared Kafka event contracts (JSON Schema)
├── gateway/            # Kong API Gateway config
├── infra/              # Docker Compose, Kubernetes manifests
│   ├── docker/
│   ├── k8s/
│   └── helm/
└── libs/               # Shared libraries (per language)
```

## Quick Start

```bash
# Start infrastructure (Kafka, PostgreSQL, Redis, etc.)
docker compose -f infra/docker/docker-compose.yml up -d

# Start a specific service (e.g. finance-svc)
cd services/finance-svc
npm install
npm run start:dev
```

## Golden Rules

1. One service = one domain = one database
2. All external traffic through API Gateway only
3. No direct DB queries across services
4. Async (Kafka) by default; gRPC for sync queries only
5. Outbox pattern for event publishing
6. Every Kafka consumer must be idempotent
7. JWT validated at gateway AND at every service
8. Secrets from Vault — never hardcoded
9. tenant_id from JWT only — never from request body
10. Money as NUMERIC(19,4) — never FLOAT
11. Analytics via ClickHouse — never operational DBs
12. mTLS for all internal traffic
