FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci && npm cache clean --force
COPY . .
RUN npm run build

FROM node:20-alpine AS runner

RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

USER appuser
EXPOSE 3004
CMD ["node", "dist/main"]
