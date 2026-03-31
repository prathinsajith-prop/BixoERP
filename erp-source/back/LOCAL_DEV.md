# Local Development Setup (Without Docker for App Services)

## Prerequisites

- Node.js >= 20, npm >= 10.8.0
- Docker (for infrastructure only)

---

## Terminal 1 — Infrastructure (databases, message broker, etc.)

```bash
cd /Volumes/Works/Bixo/erp/back
docker compose -f infra/docker/docker-compose.yml up -d postgres redis kafka zookeeper
```

---

## Terminal 2 — Auth/Core Service (port 3015)

```bash
cd /Volumes/Works/Bixo/erp/back/services/core
cp .env.example .env
# Fix DB credentials to match init script:
sed -i '' 's/DB_PASSWORD=erp_secret/DB_PASSWORD=erp_app_password/' .env
npm install
npm run migration:run
npm run start:dev
```

---

## Terminal 3 — HR Service (port 3003)

```bash
cd /Volumes/Works/Bixo/erp/back/services/hr-svc
cp .env.example .env
# Fix DB credentials to match init script:
sed -i '' 's/DB_USERNAME=erp/DB_USERNAME=erp_app/' .env
sed -i '' 's/DB_PASSWORD=erp_dev_password/DB_PASSWORD=erp_app_password/' .env
npm install
npm run start:dev   # synchronize:true auto-creates tables, no migration needed
```

---

## Terminal 4 — Frontend (Core + HR apps)

```bash
cd /Volumes/Works/Bixo/erp/front
npm install
npx turbo run dev --filter=core --filter=@erp/hr-app
```

---

## Access URLs

| App            | URL                    |
| -------------- | ---------------------- |
| Core frontend  | http://localhost:3000   |
| HR frontend    | http://localhost:4003   |
| Auth/Core API  | http://localhost:3015   |
| HR API         | http://localhost:3003   |

---

## Notes

- If the frontend rewrites point to Kong (port 8000), update `front/apps/core/next.config.ts` and `front/apps/hr/next.config.ts` to point directly to the backend service ports (3015 / 3003) instead.
- DB credentials in `.env.example` don't match the init script — fix after copying (see commands above).
- HR service uses `synchronize: true` so tables are auto-created; no migrations needed.
- Core service requires `npm run migration:run` on first setup.
npm install
