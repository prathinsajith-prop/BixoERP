package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type TenantMiddleware struct{}

func NewTenantMiddleware() *TenantMiddleware {
	return &TenantMiddleware{}
}

func (m *TenantMiddleware) Handle(c *fiber.Ctx) error {
	tenantID, ok := c.Locals("tenant_id").(uuid.UUID)
	if !ok || tenantID == uuid.Nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "tenant context required"})
	}
	return c.Next()
}
