# ERP Backend — Copilot Instructions

Multi-tenant, event-driven ERP system: 14 microservices across 4 language stacks.

## Architecture

- **14 domain services**, independently deployable (see `services/`)
- **Event-driven** async via Kafka; sync queries via gRPC only
- **Multi-tenant** schema-per-tenant isolation; `tenant_id` from JWT — never request body
- **API Gateway** (Kong) as single entry point; all external traffic through gateway only

### Service Stack Map

| Stack | Services |
|-------|----------|
| TypeScript / NestJS | finance-svc, apar-svc, hr-svc, sales-svc, project-svc, notification-svc, workflow-svc, files-svc, integration-svc, core (auth) |
| Go / Fiber | inventory-svc, audit-svc |
| Java / Spring Boot | procurement-svc, manufacturing-svc |
| Python / FastAPI | report-svc |

## Golden Rules

1. One service = one domain = one database — no cross-service DB queries
2. Async (Kafka) by default; gRPC for sync queries only
3. Outbox pattern for all event publishing — events + aggregate saved atomically
4. Every Kafka consumer must be idempotent
5. JWT validated at gateway AND at every service
6. Money as `NUMERIC(19,4)` — never FLOAT
7. Secrets from Vault — never hardcoded
8. `tenant_id` always from JWT middleware — never from request body
9. Analytics via ClickHouse — never query operational DBs for reports
10. mTLS for all internal traffic

## NestJS Services (finance, apar, hr, sales, project, workflow, files, notification, integration, core)

### Directory Structure

```
services/{name}-svc/src/
├── api/
│   ├── controllers/     # REST endpoints, thin — delegates to use cases
│   └── dto/             # Zod schemas (NOT class-validator)
├── application/
│   └── use-cases/       # One class per operation, injected via DI
├── domain/
│   ├── entities/        # Aggregate roots with invariant checking
│   ├── value-objects/   # Money, FiscalPeriod, ExchangeRate, etc.
│   ├── events/          # Domain event classes
│   └── repositories/    # Port interfaces (abstract classes)
├── infrastructure/
│   ├── database/
│   │   ├── entities/    # TypeORM *OrmEntity classes (separate from domain)
│   │   ├── repositories/# Repository implementations (outbox-aware)
│   │   └── migrations/  # TypeORM migration files
│   ├── kafka/           # Producer/consumer implementations
│   └── grpc/            # gRPC client/server
└── app.module.ts        # Root DI wiring
```

### Key Patterns

- **Validation**: Zod schemas in `api/dto/` — runtime validation + type inference. NOT class-validator.
- **DI tokens**: Symbol-based (`EVENT_PUBLISHER`, `CACHE_PORT`) for swappability
- **Domain entities**: Extend `AggregateRoot<T>` with business invariant methods
- **ORM entities**: Separate `*OrmEntity` in `infrastructure/database/entities/` — never mix with domain
- **Use cases**: One per operation in `application/use-cases/`, supports idempotency key
- **Outbox**: Repository saves aggregate + outbox event in one transaction; relay polls every 5s
- **Decorators**: `@TenantId()` and `@CurrentUser()` extract context from JWT
- **Exceptions**: Domain exceptions → global filter → `{ statusCode, code, message }`
- **Migrations**: `npm run migration:generate` then `npm run migration:run`

### Commands (NestJS services)

```bash
npm install && npm run start:dev     # Development
npm run build                        # Build
npm run test                         # Unit tests (Jest + ts-jest)
npm run test:e2e                     # E2E tests (testcontainers)
npm run migration:generate           # Generate TypeORM migration
npm run migration:run                # Apply migrations
npm run lint                         # ESLint
```

## Go Services (inventory-svc, audit-svc)

- Manual DI in `main()` — no framework container
- Fiber middleware: `func(c *fiber.Ctx) error { return c.Next() }`
- Handlers extract tenant/user from `c.Locals()`
- Audit-svc uses Elasticsearch with cryptographic hash chain for integrity
- Build: `go build -o bin/server ./cmd/server`

## Java Services (procurement-svc, manufacturing-svc)

- Spring Boot with `@RestController`, Spring Security for JWT
- Entities: `@Getter @Builder` with factory methods, state machine pattern
- Migrations: Flyway SQL versioning (`V001__`, `V002__`) in `src/main/resources/db/migration/`
- gRPC via `grpc-spring-boot-starter`
- Build: `mvn clean package` / `mvn spring-boot:run`

## Python Service (report-svc)

- FastAPI with async (aiokafka, asyncio)
- Pydantic `BaseSettings` for config (auto-loads `.env`)
- CQRS read model — consumes events, queries ClickHouse
- Routes: `APIRouter` with `Depends()` injection
- Run: `uvicorn app.main:app --reload`
- Test: `pytest` with `pytest-asyncio`

## Event Contracts

- Topic naming: `erp.{domain}.{aggregate}.{event}` (e.g., `erp.finance.journal-entry.posted`)
- All events follow `events/envelope.schema.json` (correlation_id, causation_id, tenant_id, user_id)
- Domain-specific schemas in `events/{domain}/events.schema.json`
- gRPC contracts in `proto/{domain}/v1/`

## Infrastructure

```bash
# Start infra (Kafka, PostgreSQL, Redis, etc.)
docker compose -f infra/docker/docker-compose.yml up -d

# Start specific service
cd services/{name}-svc && npm run start:dev
```

- Kong routes: `gateway/kong.yml` — path-based routing `/api/v1/{service}`
- Service ports: 3001–3015 (HTTP) + 50051 (gRPC)
- See `LOCAL_DEV.md` for full local setup including credential fixes

## Implementing New Features (NestJS)

1. Domain entity + aggregate root → `domain/entities/`
2. Repository port (abstract class) → `domain/repositories/`
3. Repository implementation (outbox-aware) → `infrastructure/database/repositories/`
4. ORM entity → `infrastructure/database/entities/`
5. Use case → `application/use-cases/` (with idempotency support)
6. Zod DTO → `api/dto/`
7. Controller → `api/controllers/`
8. Wire in module → `app.module.ts`
9. Migration → `npm run migration:generate`
