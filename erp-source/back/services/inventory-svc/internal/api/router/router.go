package router

import (
	"github.com/erp/inventory-svc/internal/api/handler"
	"github.com/erp/inventory-svc/internal/api/middleware"
	"github.com/gofiber/fiber/v2"
)

func Setup(
	app *fiber.App,
	stockHandler *handler.StockHandler,
	movementHandler *handler.MovementHandler,
	healthHandler *handler.HealthHandler,
	jwtMw *middleware.JWTMiddleware,
	tenantMw *middleware.TenantMiddleware,
) {
	// Health endpoints (no auth)
	app.Get("/health", healthHandler.Live)
	app.Get("/health/ready", healthHandler.Ready)

	// API v1
	api := app.Group("/api/v1", jwtMw.Handle, tenantMw.Handle)

	// Stock items
	stocks := api.Group("/stocks")
	stocks.Post("/", stockHandler.Create)
	stocks.Get("/", stockHandler.List)
	stocks.Get("/below-reorder", stockHandler.GetBelowReorder)
	stocks.Get("/:id", stockHandler.GetByID)
	stocks.Patch("/:id", stockHandler.Update)
	stocks.Delete("/:id", stockHandler.Delete)

	// Stock movements
	movements := api.Group("/movements")
	movements.Post("/receive", movementHandler.Receive)
	movements.Post("/issue", movementHandler.Issue)
	movements.Post("/transfer", movementHandler.Transfer)
}
