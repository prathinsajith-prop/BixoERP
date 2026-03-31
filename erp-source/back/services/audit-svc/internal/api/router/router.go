package router

import (
	"github.com/erp/audit-svc/internal/api/handler"
	"github.com/erp/audit-svc/internal/api/middleware"
	"github.com/gofiber/fiber/v2"
)

// Setup configures all routes for the audit service.
func Setup(
	app *fiber.App,
	auditHandler *handler.AuditHandler,
	healthHandler *handler.HealthHandler,
	jwtMw *middleware.JWTMiddleware,
	tenantMw *middleware.TenantMiddleware,
) {
	// Health endpoints (no auth)
	app.Get("/health", healthHandler.Health)
	app.Get("/ready", healthHandler.Ready)

	// API v1 — authenticated
	api := app.Group("/api/v1", jwtMw.Handle, tenantMw.Handle)

	// Audit search
	audit := api.Group("/audit")
	audit.Get("/search", auditHandler.Search)
	audit.Get("/entity/:aggregateType/:aggregateId", auditHandler.GetByEntity)
	audit.Get("/user/:userId", auditHandler.GetByUser)
	audit.Get("/verify", auditHandler.VerifyIntegrity)
}
