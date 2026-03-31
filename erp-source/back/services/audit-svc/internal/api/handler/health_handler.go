package handler

import (
	"github.com/elastic/go-elasticsearch/v8"
	"github.com/gofiber/fiber/v2"
)

type HealthHandler struct {
	esClient *elasticsearch.Client
}

func NewHealthHandler(esClient *elasticsearch.Client) *HealthHandler {
	return &HealthHandler{esClient: esClient}
}

// Health returns the service health status.
// GET /health
func (h *HealthHandler) Health(c *fiber.Ctx) error {
	esOk := true

	res, err := h.esClient.Ping()
	if err != nil {
		esOk = false
	} else {
		defer res.Body.Close()
		if res.IsError() {
			esOk = false
		}
	}

	status := "healthy"
	httpStatus := fiber.StatusOK
	if !esOk {
		status = "degraded"
		httpStatus = fiber.StatusServiceUnavailable
	}

	return c.Status(httpStatus).JSON(fiber.Map{
		"status":  status,
		"service": "audit-svc",
		"checks": fiber.Map{
			"elasticsearch": esOk,
		},
	})
}

// Ready returns readiness probe.
// GET /ready
func (h *HealthHandler) Ready(c *fiber.Ctx) error {
	res, err := h.esClient.Ping()
	if err != nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"ready": false})
	}
	defer res.Body.Close()

	if res.IsError() {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"ready": false})
	}

	return c.JSON(fiber.Map{"ready": true})
}
