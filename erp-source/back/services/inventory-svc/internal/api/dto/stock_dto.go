package dto

import (
	"errors"
	"time"

	"github.com/erp/inventory-svc/internal/domain/entity"
	"github.com/google/uuid"
)

// --- Stock Item DTOs ---

type CreateStockItemRequest struct {
	SKU          string `json:"sku"`
	Name         string `json:"name"`
	Description  string `json:"description"`
	ReorderLevel string `json:"reorder_level"`
	Currency     string `json:"currency"`
	WarehouseID  string `json:"warehouse_id"`
}

func (r *CreateStockItemRequest) Validate() error {
	if r.SKU == "" {
		return errors.New("sku is required")
	}
	if r.Name == "" {
		return errors.New("name is required")
	}
	if r.WarehouseID == "" {
		return errors.New("warehouse_id is required")
	}
	if r.Currency == "" {
		r.Currency = "USD"
	}
	if r.ReorderLevel == "" {
		r.ReorderLevel = "0"
	}
	return nil
}

type UpdateStockItemRequest struct {
	Name         string `json:"name"`
	Description  string `json:"description"`
	ReorderLevel string `json:"reorder_level"`
	IsActive     *bool  `json:"is_active"`
}

type StockItemResponse struct {
	ID           string    `json:"id"`
	TenantID     string    `json:"tenant_id"`
	SKU          string    `json:"sku"`
	Name         string    `json:"name"`
	Description  string    `json:"description"`
	Quantity     string    `json:"quantity"`
	ReorderLevel string    `json:"reorder_level"`
	UnitCost     string    `json:"unit_cost"`
	Currency     string    `json:"currency"`
	WarehouseID  string    `json:"warehouse_id"`
	CategoryID   string    `json:"category_id,omitempty"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func MapStockItem(item *entity.StockItem) StockItemResponse {
	catID := ""
	if item.CategoryID != nil {
		catID = item.CategoryID.String()
	}
	return StockItemResponse{
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
		CategoryID:   catID,
		IsActive:     item.IsActive,
		CreatedAt:    item.CreatedAt,
		UpdatedAt:    item.UpdatedAt,
	}
}

// --- Movement DTOs ---

type ReceiveStockRequest struct {
	StockItemID string `json:"stock_item_id"`
	WarehouseID string `json:"warehouse_id"`
	Quantity    string `json:"quantity"`
	Notes       string `json:"notes"`
}

func (r *ReceiveStockRequest) Validate() error {
	if r.StockItemID == "" {
		return errors.New("stock_item_id is required")
	}
	if r.WarehouseID == "" {
		return errors.New("warehouse_id is required")
	}
	if r.Quantity == "" {
		return errors.New("quantity is required")
	}
	return nil
}

type IssueStockRequest struct {
	StockItemID string `json:"stock_item_id"`
	WarehouseID string `json:"warehouse_id"`
	Quantity    string `json:"quantity"`
	Notes       string `json:"notes"`
}

func (r *IssueStockRequest) Validate() error {
	if r.StockItemID == "" {
		return errors.New("stock_item_id is required")
	}
	if r.WarehouseID == "" {
		return errors.New("warehouse_id is required")
	}
	if r.Quantity == "" {
		return errors.New("quantity is required")
	}
	return nil
}

type TransferStockRequest struct {
	StockItemID     string `json:"stock_item_id"`
	FromWarehouseID string `json:"from_warehouse_id"`
	ToWarehouseID   string `json:"to_warehouse_id"`
	Quantity        string `json:"quantity"`
	Notes           string `json:"notes"`
}

func (r *TransferStockRequest) Validate() error {
	if r.StockItemID == "" {
		return errors.New("stock_item_id is required")
	}
	if r.FromWarehouseID == "" {
		return errors.New("from_warehouse_id is required")
	}
	if r.ToWarehouseID == "" {
		return errors.New("to_warehouse_id is required")
	}
	if r.Quantity == "" {
		return errors.New("quantity is required")
	}
	return nil
}

type MovementResponse struct {
	ID              string    `json:"id"`
	TenantID        string    `json:"tenant_id"`
	StockItemID     string    `json:"stock_item_id"`
	MovementType    string    `json:"movement_type"`
	Quantity        string    `json:"quantity"`
	FromWarehouseID string    `json:"from_warehouse_id,omitempty"`
	ToWarehouseID   string    `json:"to_warehouse_id,omitempty"`
	ReferenceID     string    `json:"reference_id,omitempty"`
	ReferenceType   string    `json:"reference_type,omitempty"`
	Notes           string    `json:"notes,omitempty"`
	CreatedBy       string    `json:"created_by"`
	CreatedAt       time.Time `json:"created_at"`
}

func MapMovement(m *entity.StockMovement) MovementResponse {
	resp := MovementResponse{
		ID:            m.ID.String(),
		TenantID:      m.TenantID.String(),
		StockItemID:   m.StockItemID.String(),
		MovementType:  string(m.MovementType),
		Quantity:      m.Quantity.String(),
		ReferenceType: m.ReferenceType,
		Notes:         m.Notes,
		CreatedBy:     m.CreatedBy.String(),
		CreatedAt:     m.CreatedAt,
	}
	if m.FromWarehouseID != nil {
		resp.FromWarehouseID = m.FromWarehouseID.String()
	}
	if m.ToWarehouseID != nil {
		resp.ToWarehouseID = m.ToWarehouseID.String()
	}
	if m.ReferenceID != nil && *m.ReferenceID != uuid.Nil {
		resp.ReferenceID = m.ReferenceID.String()
	}
	return resp
}

// --- Pagination ---

type PaginatedResponse struct {
	Data  interface{} `json:"data"`
	Total int64       `json:"total"`
	Page  int         `json:"page"`
	Limit int         `json:"limit"`
}
