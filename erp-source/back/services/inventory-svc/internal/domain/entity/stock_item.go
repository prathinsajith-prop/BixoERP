package entity

import (
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type StockItem struct {
	ID            uuid.UUID       `json:"id"`
	TenantID      uuid.UUID       `json:"tenant_id"`
	SKU           string          `json:"sku"`
	Name          string          `json:"name"`
	Description   string          `json:"description"`
	Quantity      decimal.Decimal `json:"quantity"`
	ReorderLevel  decimal.Decimal `json:"reorder_level"`
	UnitCost      decimal.Decimal `json:"unit_cost"`
	Currency      string          `json:"currency"`
	WarehouseID   uuid.UUID       `json:"warehouse_id"`
	CategoryID    *uuid.UUID      `json:"category_id,omitempty"`
	IsActive      bool            `json:"is_active"`
	CreatedAt     time.Time       `json:"created_at"`
	UpdatedAt     time.Time       `json:"updated_at"`
}

func NewStockItem(tenantID uuid.UUID, sku, name string, warehouseID uuid.UUID, reorderLevel decimal.Decimal, currency string) *StockItem {
	now := time.Now().UTC()
	return &StockItem{
		ID:           uuid.New(),
		TenantID:     tenantID,
		SKU:          sku,
		Name:         name,
		Quantity:     decimal.Zero,
		ReorderLevel: reorderLevel,
		UnitCost:     decimal.Zero,
		Currency:     currency,
		WarehouseID:  warehouseID,
		IsActive:     true,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
}

func (s *StockItem) Receive(qty decimal.Decimal) error {
	if qty.LessThanOrEqual(decimal.Zero) {
		return ErrInvalidQuantity
	}
	s.Quantity = s.Quantity.Add(qty)
	s.UpdatedAt = time.Now().UTC()
	return nil
}

func (s *StockItem) Issue(qty decimal.Decimal) error {
	if qty.LessThanOrEqual(decimal.Zero) {
		return ErrInvalidQuantity
	}
	if s.Quantity.Sub(qty).LessThan(decimal.Zero) {
		return ErrInsufficientStock
	}
	s.Quantity = s.Quantity.Sub(qty)
	s.UpdatedAt = time.Now().UTC()
	return nil
}

func (s *StockItem) IsBelowReorder() bool {
	return s.Quantity.LessThanOrEqual(s.ReorderLevel)
}
