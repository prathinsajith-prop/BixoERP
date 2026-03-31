# Running BixoERP with Docker

Everything runs from the **workspace root** (`bixoERP/`).

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Docker | 24+ | Docker Desktop or Colima |
| Docker Compose | v2 (`docker compose`) | Included with Docker Desktop |

### Colima (macOS) — minimum resources

This project builds **15 Next.js apps + 16 backend services** in Docker. You need at least 12 GB allocated to avoid out-of-memory crashes mid-build.

```bash
# Stop any existing Colima instance first
colima stop

# Start with enough memory for parallel Next.js builds
colima start --memory 12 --cpu 6 --disk 60
```

> **Why 12 GB?** Each Next.js build uses ~1.5–2 GB. With 15 frontends building in parallel that peaks at ~20 GB. Setting `BUILDKIT_MAX_PARALLELISM=3` (used in the build commands below) caps concurrent builds so 12 GB is sufficient.

---

## Architecture

```
bixoERP/
└── erp-source/
    ├── back/infra/docker/docker-compose.yml   ← Step 1: Infrastructure
    └── docker-compose.yml                     ← Step 3: Application services
```

The app compose file joins the infra network (`docker_default`) — so **infra must start first**.

All commands below assume you are in the workspace root (`bixoERP/`).

---

## Step 1 — Start Infrastructure

```bash
cd erp-source/back/infra/docker

docker compose up -d postgres redis kafka zookeeper mongodb
```

Wait ~20 seconds for Postgres to finish its init scripts (creates all service databases and the `erp_app` role automatically).

Verify Postgres is ready:
```bash
docker compose exec postgres pg_isready -U erp
```

Then go back to the workspace root:
```bash
cd -
```

### Optional infra services

Start these only if the corresponding app service needs them:

```bash
# Kafka UI (browse topics at http://localhost:8080)
docker compose -f erp-source/back/infra/docker/docker-compose.yml up -d kafka-ui

# Elasticsearch (sales-svc, audit-svc)
docker compose -f erp-source/back/infra/docker/docker-compose.yml up -d elasticsearch

# ClickHouse (report-svc)
docker compose -f erp-source/back/infra/docker/docker-compose.yml up -d clickhouse

# MinIO / S3 (files-svc — console at http://localhost:9002)
docker compose -f erp-source/back/infra/docker/docker-compose.yml up -d minio

# Observability stack (Prometheus, Grafana, Jaeger, Loki)
docker compose -f erp-source/back/infra/docker/docker-compose.yml up -d prometheus grafana jaeger loki
```

---

## Step 2 — Build All Images (first time)

Building all 31 images at once overwhelms memory. Build in two phases instead.

### Phase A — Backend services (16 images, ~5 min)

```bash
BUILDKIT_MAX_PARALLELISM=4 docker compose -f erp-source/docker-compose.yml build \
  core finance-svc apar-svc hr-svc sales-svc inventory-svc \
  procurement-svc manufacturing-svc project-svc workflow-svc \
  notification-svc files-svc integration-svc report-svc audit-svc notification-web
```

### Phase B — Frontend apps (15 images, ~15 min)

Frontends are built **3 at a time** to stay within memory limits:

```bash
BUILDKIT_MAX_PARALLELISM=3 docker compose -f erp-source/docker-compose.yml build \
  erp-frontend hr-frontend finance-frontend

BUILDKIT_MAX_PARALLELISM=3 docker compose -f erp-source/docker-compose.yml build \
  apar-frontend inventory-frontend procurement-frontend

BUILDKIT_MAX_PARALLELISM=3 docker compose -f erp-source/docker-compose.yml build \
  manufacturing-frontend sales-frontend projects-frontend

BUILDKIT_MAX_PARALLELISM=3 docker compose -f erp-source/docker-compose.yml build \
  reports-frontend workflow-frontend notifications-frontend

BUILDKIT_MAX_PARALLELISM=3 docker compose -f erp-source/docker-compose.yml build \
  files-frontend audit-frontend integrations-frontend
```

---

## Step 3 — Start Application Services

```bash
docker compose -f erp-source/docker-compose.yml up -d
```

All images are already built from Step 2 so this just creates and starts containers.

### Start individual services (faster iteration)

```bash
# A specific backend service
docker compose -f erp-source/docker-compose.yml up -d core

# Core + HR for local testing
docker compose -f erp-source/docker-compose.yml up -d core hr-svc hr-frontend erp-frontend
```

---

## Step 4 — Run Database Migrations (first time only)

Migrations are stored in the `postgres-data` volume — only needed on a fresh install.

```bash
docker compose -f erp-source/docker-compose.yml exec core npm run migration:run
```

---

## Step 5 — Seed Demo Data (optional)

```bash
docker compose -f erp-source/docker-compose.yml exec core npm run seed
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
# View running app containers and their status
docker compose -f erp-source/docker-compose.yml ps

# Follow logs for a service
docker compose -f erp-source/docker-compose.yml logs -f core
docker compose -f erp-source/docker-compose.yml logs -f hr-svc

# Rebuild and restart a single service after a code change
docker compose -f erp-source/docker-compose.yml up --build -d core

# Stop all app services (keeps infra running)
docker compose -f erp-source/docker-compose.yml down

# Stop everything including infra
docker compose -f erp-source/docker-compose.yml down
docker compose -f erp-source/back/infra/docker/docker-compose.yml down

# Stop everything AND wipe all data volumes (destructive — loses all DB data)
docker compose -f erp-source/back/infra/docker/docker-compose.yml down -v
```

---

## Troubleshooting

### Build fails with `error reading from server: EOF`
Colima ran out of memory during parallel Next.js builds. Fix:
```bash
colima stop
colima start --memory 12 --cpu 6 --disk 60
```
Then use the **Phase A / Phase B** build approach in Step 2 (not `up --build`).

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
docker compose -f erp-source/docker-compose.yml logs <service-name>
```
Common causes: missing environment variable, database not ready yet (add a retry or wait for postgres healthcheck).

### Colima — containers can't reach each other
Infra must be started first so the `docker_default` network exists before the app services try to join it.
