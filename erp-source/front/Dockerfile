# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json turbo.json tsconfig.json ./
COPY apps/apar/package.json ./apps/apar/
COPY apps/audit/package.json ./apps/audit/
COPY apps/core/package.json ./apps/core/
COPY apps/files/package.json ./apps/files/
COPY apps/finance/package.json ./apps/finance/
COPY apps/hr/package.json ./apps/hr/
COPY apps/integrations/package.json ./apps/integrations/
COPY apps/inventory/package.json ./apps/inventory/
COPY apps/manufacturing/package.json ./apps/manufacturing/
COPY apps/notifications/package.json ./apps/notifications/
COPY apps/procurement/package.json ./apps/procurement/
COPY apps/projects/package.json ./apps/projects/
COPY apps/reports/package.json ./apps/reports/
COPY apps/sales/package.json ./apps/sales/
COPY apps/workflow/package.json ./apps/workflow/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/config/package.json ./packages/config/
COPY packages/icons/package.json ./packages/icons/
COPY packages/shared/package.json ./packages/shared/
COPY packages/shell/package.json ./packages/shell/
COPY packages/ui/package.json ./packages/ui/

RUN --mount=type=cache,target=/root/.npm \
    npm ci && \
    npm install --no-save \
      lightningcss-linux-arm64-musl \
      lightningcss-linux-x64-musl \
      @tailwindcss/oxide-linux-arm64-musl \
      @tailwindcss/oxide-linux-x64-musl

COPY apps/ ./apps/
COPY packages/ ./packages/

ENV DOCKER_ENV=true
RUN npx turbo build --filter=core

FROM node:20-alpine AS runner

RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001

WORKDIR /app

# Standalone output includes a minimal node_modules — no need to copy the full 500 MB one
COPY --from=builder --chown=appuser:appgroup /app/apps/core/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/apps/core/.next/static ./apps/core/.next/static
COPY --from=builder --chown=appuser:appgroup /app/apps/core/public ./apps/core/public

USER appuser
EXPOSE 4000
ENV PORT=4000 HOSTNAME=0.0.0.0

CMD ["node", "apps/core/server.js"]
