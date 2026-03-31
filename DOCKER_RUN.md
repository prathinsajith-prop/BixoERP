# Running BixoERP with Docker

Everything runs from the **workspace root** (`bixoERP/`).

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Docker | 24+ | Docker Desktop or Colima |
| Docker Compose | v2 (`docker compose`) | Included with Docker Desktop |

If using **Colima** on macOS:
```bash
colima start --memory 6 --cpu 4
```

---

## Architecture

```
bixoERP/
├── erp-source/back/infra/docker/docker-compose.yml   ← Step 1: Infrastructure
└── docker-compose.yml                                 ← Step 2: Application services
```

The app services compose file connects to the infra network (`docker_default`) — so **infra must start first**.

---

## Step 1 — Start Infrastructure

```bash
cd erp-source/back/infra/docker

docker compose up -d \
  postgres \
  redis \
  kafka \
  zookeeper
```

Wait ~20 seconds for Postgres to finish running its init scripts (creates all service databases and the `erp_app` role automatically).

To verify Postgres is ready:
```bash
docker compose exec postgres pg_isready -U erp
```

### Optional infra services

Start these only if the corresponding app service needs them:

```bash
# Kafka UI (browse topics at http://localhost:8080)
docker compose up -d kafka-ui

# MongoDB (notification-svc, integration-svc)
docker compose up -d mongodb

# Elasticsearch (sales-svc, audit-svc)
docker compose up -d elasticsearch

# ClickHouse (report-svc)
docker compose up -d clickhouse

# MinIO / S3 (files-svc — console at http://localhost:9002)
docker compose up -d minio

# Observability stack (Prometheus, Grafana, Jaeger, Loki)
docker compose up -d prometheus grafana jaeger loki
```

---

## Step 2 — Run Database Migrations (first time only)

The migrations only need to run once. After that the schema is persisted in the `postgres-data` Docker volume.

```bash
cd erp-source/back/services/core
npm install
npm run migration:run
```

---

## Step 3 — Build & Start Application Services

Go back to the workspace root (`bixoERP/`).

### All services at once

```bash
cd /path/to/bixoERP
docker compose up --build -d
```

Build takes several minutes on the first run.

### Individual services (faster iteration)

```bash
# Backend only
docker compose up --build -d core hr-svc finance-svc sales-svc

# A specific service
docker compose up --build -d core
```

---

## Step 4 — Seed Demo Data (optional)

```bash
cd erp-source/back/services/core
npm run seed
```

Creates: 4 users, 4 roles, 41 permissions, 1 organisation.

| Email | Password | Role |
|-------|----------|------|
| admin@erp.com | Admin@123 | Super Admin |
| finance@erp.com | Finance@123 | Finance |
| hr@erp.com | HrUser@123 | HR |
| sales@erp.com | Sales@123 | Sales |

---

## Port Reference

### Infrastructure

| Service | Port | URL |
|---------|------|-----|
| PostgreSQL | 5436 | — |
| Redis | 6379 | — |
| Kafka | 9092 | — |
| Kafka UI | 8080 | http://localhost:8080 |
| MongoDB | 27017 | — |
| Elasticsearch | 9200 | — |
| ClickHouse | 8123 | — |
| MinIO API | 9001 | — |
| MinIO Console | 9002 | http://localhost:9002 |
| Prometheus | 9090 | http://localhost:9090 |
| Grafana | 3000 | http://localhost:3000 (admin/admin) |
| Jaeger | 16686 | http://localhost:16686 |

### Backend services

| Service | HTTP Port | gRPC Port |
|---------|-----------|-----------|
| core (auth) | 3015 | 50065 |
| finance-svc | 3001 | 50051 |
| apar-svc | 3002 | — |
| hr-svc | 3003 | — |
| sales-svc | 3004 | — |
| inventory-svc | 3005 | 50055 |
| procurement-svc | 3006 | 50056 |
| manufacturing-svc | 3007 | — |
| project-svc | 3008 | — |
| workflow-svc | 3009 | — |
| notification-svc | 3010 | — |
| files-svc | 3011 | — |
| integration-svc | 3012 | — |
| report-svc | 3013 | — |
| audit-svc | 3014 | — |

### Frontend apps

| App | Port | URL |
|-----|------|-----|
| Core / Shell | 4000 | http://localhost:4000 |
| Finance | 4001 | http://localhost:4001 |
| AP/AR | 4002 | http://localhost:4002 |
| HR | 4003 | http://localhost:4003 |
| Inventory | 4004 | http://localhost:4004 |
| Procurement | 4005 | http://localhost:4005 |
| Manufacturing | 4006 | http://localhost:4006 |
| Sales | 4007 | http://localhost:4007 |
| Projects | 4008 | http://localhost:4008 |
| Reports | 4009 | http://localhost:4009 |
| Workflow | 4010 | http://localhost:4010 |
| Notifications | 4011 | http://localhost:4011 |
| Files | 4012 | http://localhost:4012 |
| Audit | 4013 | http://localhost:4013 |
| Integrations | 4014 | http://localhost:4014 |

---

## Useful Commands

```bash
# View running containers
docker compose ps

# Follow logs for a service
docker compose logs -f core
docker compose logs -f hr-svc

# Restart a single service after a code change
docker compose up --build -d core

# Stop all app services (keeps infra running)
docker compose down

# Stop everything including infra
cd erp-source/back/infra/docker && docker compose down

# Stop everything AND wipe all data volumes
cd erp-source/back/infra/docker && docker compose down -v
```

---

## Troubleshooting

### Port already in use
Another service on your machine is occupying a port.
```bash
lsof -i :<port>   # find the PID
kill <PID>        # free the port
```
Known conflicts on macOS: Homebrew Postgres (5432), other projects on 6379 or 8080.

### Postgres port is 5436, not 5432
The infra compose remaps Docker Postgres to `5436` to avoid conflicts with a local Homebrew/system Postgres on `5432`. All `.env` files in this repo already use `DB_PORT=5436`.

### `role "erp" does not exist` on localhost
You're connecting to your local Postgres instead of the Docker one. Make sure `DB_HOST=localhost` and `DB_PORT=5436` (not 5432) in the relevant `.env`.

### Container exits immediately
```bash
docker compose logs <service-name>
```
Common causes: missing environment variable, database not ready yet (add a retry or wait for postgres healthcheck).

### Colima — containers can't reach each other
Make sure all services share the same network. The app `docker-compose.yml` uses `docker_default` (the network created by the infra compose). Start infra first so that network exists.
