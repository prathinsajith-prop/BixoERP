package handler

import (
	"github.com/erp/inventory-svc/internal/api/dto"
	"github.com/erp/inventory-svc/internal/application/usecase"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type MovementHandler struct {
	receiveStock  *usecase.ReceiveStockUseCase
	issueStock    *usecase.IssueStockUseCase
	transferStock *usecase.TransferStockUseCase
}

func NewMovementHandler(
	receiveStock *usecase.ReceiveStockUseCase,
	issueStock *usecase.IssueStockUseCase,
	transferStock *usecase.TransferStockUseCase,
) *MovementHandler {
	return &MovementHandler{
		receiveStock:  receiveStock,
		issueStock:    issueStock,
		transferStock: transferStock,
	}
}

func (h *MovementHandler) Receive(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(uuid.UUID)
	userID := c.Locals("user_id").(uuid.UUID)

	var req dto.ReceiveStockRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	if err := req.Validate(); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	stockItemID, _ := uuid.Parse(req.StockItemID)
	warehouseID, _ := uuid.Parse(req.WarehouseID)
	qty, _ := decimal.NewFromString(req.Quantity)

	movement, err := h.receiveStock.Execute(c.Context(), usecase.ReceiveStockInput{
		TenantID:    tenantID,
		StockItemID: stockItemID,
		WarehouseID: warehouseID,
		Quantity:    qty,
		UserID:      userID,
		Notes:       req.Notes,
	})
	if err != nil {
		return mapDomainError(c, err)
	}

	return c.Status(fiber.StatusCreated).JSON(dto.MapMovement(movement))
}

func (h *MovementHandler) Issue(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(uuid.UUID)
	userID := c.Locals("user_id").(uuid.UUID)

	var req dto.IssueStockRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	if err := req.Validate(); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	stockItemID, _ := uuid.Parse(req.StockItemID)
	warehouseID, _ := uuid.Parse(req.WarehouseID)
	qty, _ := decimal.NewFromString(req.Quantity)

	movement, err := h.issueStock.Execute(c.Context(), usecase.IssueStockInput{
		TenantID:    tenantID,
		StockItemID: stockItemID,
		WarehouseID: warehouseID,
		Quantity:    qty,
		UserID:      userID,
		Notes:       req.Notes,
	})
	if err != nil {
		return mapDomainError(c, err)
	}

	return c.Status(fiber.StatusCreated).JSON(dto.MapMovement(movement))
}

func (h *MovementHandler) Transfer(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(uuid.UUID)
	userID := c.Locals("user_id").(uuid.UUID)

	var req dto.TransferStockRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	if err := req.Validate(); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	stockItemID, _ := uuid.Parse(req.StockItemID)
	fromWH, _ := uuid.Parse(req.FromWarehouseID)
	toWH, _ := uuid.Parse(req.ToWarehouseID)
	qty, _ := decimal.NewFromString(req.Quantity)

	movement, err := h.transferStock.Execute(c.Context(), usecase.TransferStockInput{
		TenantID:        tenantID,
		StockItemID:     stockItemID,
		FromWarehouseID: fromWH,
		ToWarehouseID:   toWH,
		Quantity:        qty,
		UserID:          userID,
		Notes:           req.Notes,
	})
	if err != nil {
		return mapDomainError(c, err)
	}

	return c.Status(fiber.StatusCreated).JSON(dto.MapMovement(movement))
}

func mapDomainError(c *fiber.Ctx, err error) error {
	switch err.Error() {
	case "entity not found":
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	case "insufficient stock quantity":
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": err.Error()})
	case "quantity must be greater than zero", "warehouse is required":
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	default:
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}
}
