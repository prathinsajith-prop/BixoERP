package handler

import (
	"encoding/json"
	"time"

	"github.com/erp/inventory-svc/internal/api/dto"
	"github.com/erp/inventory-svc/internal/application/port"
	"github.com/erp/inventory-svc/internal/domain/entity"
	"github.com/erp/inventory-svc/internal/domain/repository"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type StockHandler struct {
	stockRepo repository.StockRepository
	cache     port.CachePort
}

func NewStockHandler(stockRepo repository.StockRepository, cache port.CachePort) *StockHandler {
	return &StockHandler{stockRepo: stockRepo, cache: cache}
}

func (h *StockHandler) Create(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(uuid.UUID)

	var req dto.CreateStockItemRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	if err := req.Validate(); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	warehouseID, err := uuid.Parse(req.WarehouseID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid warehouse_id"})
	}

	reorderLevel, _ := decimal.NewFromString(req.ReorderLevel)
	item := entity.NewStockItem(tenantID, req.SKU, req.Name, warehouseID, reorderLevel, req.Currency)
	item.Description = req.Description

	if err := h.stockRepo.Create(c.Context(), item); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create stock item"})
	}

	return c.Status(fiber.StatusCreated).JSON(dto.StockItemResponse{
		ID:           item.ID.String(),
		TenantID:     item.TenantID.String(),
		SKU:          item.SKU,
		Name:         item.Name,
		Description:  item.Description,
		Quantity:     item.Quantity.String(),
		ReorderLevel: item.ReorderLevel.String(),
		UnitCost:     item.UnitCost.String(),
		Currency:     item.Currency,
		WarehouseID:  item.WarehouseID.String(),
		IsActive:     item.IsActive,
		CreatedAt:    item.CreatedAt,
		UpdatedAt:    item.UpdatedAt,
	})
}

func (h *StockHandler) GetByID(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(uuid.UUID)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid id"})
	}

	// Check cache
	cacheKey := "inventory:stock:" + id.String()
	if cached, err := h.cache.Get(c.Context(), cacheKey); err == nil && cached != nil {
		var resp dto.StockItemResponse
		if json.Unmarshal(cached, &resp) == nil {
			return c.JSON(resp)
		}
	}

	item, err := h.stockRepo.GetByID(c.Context(), tenantID, id)
	if err != nil {
		if err == entity.ErrNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "stock item not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch stock item"})
	}

	resp := dto.MapStockItem(item)

	// Cache for 5 minutes
	if data, err := json.Marshal(resp); err == nil {
		_ = h.cache.Set(c.Context(), cacheKey, data, 5*time.Minute)
	}

	return c.JSON(resp)
}

func (h *StockHandler) List(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(uuid.UUID)

	filter := repository.StockFilter{
		SKU:   c.Query("sku"),
		Page:  c.QueryInt("page", 1),
		Limit: c.QueryInt("limit", 20),
	}

	if whID := c.Query("warehouse_id"); whID != "" {
		wid, err := uuid.Parse(whID)
		if err == nil {
			filter.WarehouseID = &wid
		}
	}

	if active := c.Query("is_active"); active != "" {
		val := active == "true"
		filter.IsActive = &val
	}

	items, total, err := h.stockRepo.List(c.Context(), tenantID, filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to list stock items"})
	}

	var respItems []dto.StockItemResponse
	for _, item := range items {
		respItems = append(respItems, dto.MapStockItem(item))
	}

	return c.JSON(dto.PaginatedResponse{
		Data:  respItems,
		Total: total,
		Page:  filter.Page,
		Limit: filter.Limit,
	})
}

func (h *StockHandler) Update(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(uuid.UUID)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid id"})
	}

	item, err := h.stockRepo.GetByID(c.Context(), tenantID, id)
	if err != nil {
		if err == entity.ErrNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "stock item not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch stock item"})
	}

	var req dto.UpdateStockItemRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	if req.Name != "" {
		item.Name = req.Name
	}
	if req.Description != "" {
		item.Description = req.Description
	}
	if req.ReorderLevel != "" {
		rl, err := decimal.NewFromString(req.ReorderLevel)
		if err == nil {
			item.ReorderLevel = rl
		}
	}
	if req.IsActive != nil {
		item.IsActive = *req.IsActive
	}

	if err := h.stockRepo.Update(c.Context(), item); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update stock item"})
	}

	_ = h.cache.Delete(c.Context(), "inventory:stock:"+id.String())

	return c.JSON(dto.MapStockItem(item))
}

func (h *StockHandler) Delete(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(uuid.UUID)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid id"})
	}

	if err := h.stockRepo.Delete(c.Context(), tenantID, id); err != nil {
		if err == entity.ErrNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "stock item not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to delete stock item"})
	}

	_ = h.cache.Delete(c.Context(), "inventory:stock:"+id.String())

	return c.SendStatus(fiber.StatusNoContent)
}

func (h *StockHandler) GetBelowReorder(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(uuid.UUID)

	items, err := h.stockRepo.GetBelowReorder(c.Context(), tenantID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch reorder items"})
	}

	var respItems []dto.StockItemResponse
	for _, item := range items {
		respItems = append(respItems, dto.MapStockItem(item))
	}

	return c.JSON(fiber.Map{"data": respItems, "count": len(respItems)})
}
