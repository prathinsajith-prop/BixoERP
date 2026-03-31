package handler

import (
	"time"

	"github.com/erp/audit-svc/internal/api/dto"
	"github.com/erp/audit-svc/internal/application/usecase"
	"github.com/erp/audit-svc/internal/domain/entity"
	"github.com/erp/audit-svc/internal/domain/repository"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type AuditHandler struct {
	searchUC   *usecase.SearchAuditUseCase
	verifyUC   *usecase.VerifyIntegrityUseCase
}

func NewAuditHandler(searchUC *usecase.SearchAuditUseCase, verifyUC *usecase.VerifyIntegrityUseCase) *AuditHandler {
	return &AuditHandler{
		searchUC: searchUC,
		verifyUC: verifyUC,
	}
}

// Search handles full-text search with filters.
// GET /api/v1/audit/search
func (h *AuditHandler) Search(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(uuid.UUID).String()

	var req dto.SearchRequest
	if err := c.QueryParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid query parameters"})
	}

	var from, to time.Time
	if req.From != "" {
		parsed, err := time.Parse(time.RFC3339, req.From)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid 'from' date format, use RFC3339"})
		}
		from = parsed
	}
	if req.To != "" {
		parsed, err := time.Parse(time.RFC3339, req.To)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid 'to' date format, use RFC3339"})
		}
		to = parsed
	}

	params := repository.SearchParams{
		Query:         req.Query,
		TenantID:      tenantID,
		AggregateID:   req.AggregateID,
		AggregateType: req.AggregateType,
		UserID:        req.UserID,
		EventType:     req.EventType,
		Action:        req.Action,
		From:          from,
		To:            to,
		Offset:        req.Offset,
		Limit:         req.Limit,
		SortField:     req.SortField,
		SortOrder:     req.SortOrder,
	}

	result, err := h.searchUC.Execute(c.Context(), params)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(dto.PaginatedResponse{
		Data:   toResponseList(result.Entries),
		Total:  result.Total,
		Offset: result.Offset,
		Limit:  result.Limit,
	})
}

// GetByEntity returns audit entries for a specific entity.
// GET /api/v1/audit/entity/:aggregateType/:aggregateId
func (h *AuditHandler) GetByEntity(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(uuid.UUID).String()
	aggregateType := c.Params("aggregateType")
	aggregateID := c.Params("aggregateId")

	offset := c.QueryInt("offset", 0)
	limit := c.QueryInt("limit", 20)

	result, err := h.searchUC.FindByEntity(c.Context(), tenantID, aggregateType, aggregateID, offset, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(dto.PaginatedResponse{
		Data:   toResponseList(result.Entries),
		Total:  result.Total,
		Offset: result.Offset,
		Limit:  result.Limit,
	})
}

// GetByUser returns audit entries for a specific user.
// GET /api/v1/audit/user/:userId
func (h *AuditHandler) GetByUser(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(uuid.UUID).String()
	userID := c.Params("userId")

	offset := c.QueryInt("offset", 0)
	limit := c.QueryInt("limit", 20)

	result, err := h.searchUC.FindByUser(c.Context(), tenantID, userID, offset, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(dto.PaginatedResponse{
		Data:   toResponseList(result.Entries),
		Total:  result.Total,
		Offset: result.Offset,
		Limit:  result.Limit,
	})
}

// VerifyIntegrity checks the hash chain integrity for the tenant.
// GET /api/v1/audit/verify
func (h *AuditHandler) VerifyIntegrity(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(uuid.UUID).String()

	var req dto.VerifyIntegrityRequest
	if err := c.QueryParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid query parameters"})
	}

	var from, to time.Time
	if req.From != "" {
		parsed, err := time.Parse(time.RFC3339, req.From)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid 'from' date format"})
		}
		from = parsed
	}
	if req.To != "" {
		parsed, err := time.Parse(time.RFC3339, req.To)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid 'to' date format"})
		}
		to = parsed
	}

	result, err := h.verifyUC.Execute(c.Context(), tenantID, from, to)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(result)
}

// toResponseList converts domain entities to DTOs.
func toResponseList(entries []*entity.AuditEntry) []dto.AuditEntryResponse {
	resp := make([]dto.AuditEntryResponse, 0, len(entries))
	for _, e := range entries {
		resp = append(resp, dto.AuditEntryResponse{
			ID:            e.ID,
			EventID:       e.EventID,
			EventType:     e.EventType,
			AggregateID:   e.AggregateID,
			AggregateType: e.AggregateType,
			TenantID:      e.TenantID,
			UserID:        e.UserID,
			Action:        e.Action,
			Before:        e.Before,
			After:         e.After,
			Metadata:      e.Metadata,
			Timestamp:     e.Timestamp,
			PreviousHash:  e.PreviousHash,
			Hash:          e.Hash,
			Source:        e.Source,
		})
	}
	return resp
}
