package handler

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	goredis "github.com/redis/go-redis/v9"
)

type HealthHandler struct {
	db    *pgxpool.Pool
	redis *goredis.Client
}

func NewHealthHandler(db *pgxpool.Pool, redis *goredis.Client) *HealthHandler {
	return &HealthHandler{db: db, redis: redis}
}

func (h *HealthHandler) Live(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status":  "ok",
		"service": "inventory-svc",
	})
}

func (h *HealthHandler) Ready(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 3*time.Second)
	defer cancel()

	checks := fiber.Map{
		"service": "inventory-svc",
	}

	// Postgres check
	if err := h.db.Ping(ctx); err != nil {
		checks["postgres"] = "down"
		checks["status"] = "not_ready"
		return c.Status(fiber.StatusServiceUnavailable).JSON(checks)
	}
	checks["postgres"] = "up"

	// Redis check
	if err := h.redis.Ping(ctx).Err(); err != nil {
		checks["redis"] = "down"
		checks["status"] = "not_ready"
		return c.Status(fiber.StatusServiceUnavailable).JSON(checks)
	}
	checks["redis"] = "up"

	checks["status"] = "ready"
	return c.JSON(checks)
}
