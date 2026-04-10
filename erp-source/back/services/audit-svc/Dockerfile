# syntax=docker/dockerfile:1
FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /app
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod go mod download

COPY . .
RUN --mount=type=cache,target=/root/.cache/go-build --mount=type=cache,target=/go/pkg/mod \
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o /app/server ./cmd/server

FROM alpine:3.20 AS runner

RUN apk add --no-cache ca-certificates tzdata \
    && addgroup -g 1001 -S appgroup \
    && adduser -S appuser -u 1001 -G appgroup

WORKDIR /app
COPY --from=builder /app/server .

USER appuser
EXPOSE 3014
CMD ["./server"]
