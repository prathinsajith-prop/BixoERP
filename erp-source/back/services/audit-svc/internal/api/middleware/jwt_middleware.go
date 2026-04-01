package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type JWTMiddleware struct {
	secret []byte
}

func NewJWTMiddleware(secret string) *JWTMiddleware {
	return &JWTMiddleware{secret: []byte(secret)}
}

func (m *JWTMiddleware) Handle(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "missing authorization header"})
	}

	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid authorization format"})
	}

	tokenString := parts[1]

	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fiber.NewError(fiber.StatusUnauthorized, "unexpected signing method")
		}
		return m.secret, nil
	})
	if err != nil || !token.Valid {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid token"})
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid claims"})
	}

	tenantIDStr, ok := claims["tenant_id"].(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "tenant_id missing from token"})
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid tenant_id in token"})
	}

	userIDStr, _ := claims["sub"].(string)
	userID, _ := uuid.Parse(userIDStr)

	// Extract org_id — falls back to tenant_id for backward compatibility
	orgIDStr, _ := claims["org_id"].(string)
	if orgIDStr == "" {
		orgIDStr = tenantIDStr
	}
	orgID, _ := uuid.Parse(orgIDStr)

	// Extract org_role from membership claim
	orgRole, _ := claims["org_role"].(string)

	c.Locals("tenant_id", tenantID)
	c.Locals("user_id", userID)
	c.Locals("org_id", orgID)
	c.Locals("org_role", orgRole)
	c.Locals("claims", claims)

	return c.Next()
}
