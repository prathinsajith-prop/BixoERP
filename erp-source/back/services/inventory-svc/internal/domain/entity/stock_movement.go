package entity

import (
	"time"

	"github.com/erp/inventory-svc/internal/domain/valueobject"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type StockMovement struct {
	ID              uuid.UUID                `json:"id"`
	TenantID        uuid.UUID                `json:"tenant_id"`
	StockItemID     uuid.UUID                `json:"stock_item_id"`
	MovementType    valueobject.MovementType `json:"movement_type"`
	Quantity        decimal.Decimal          `json:"quantity"`
	FromWarehouseID *uuid.UUID               `json:"from_warehouse_id,omitempty"`
	ToWarehouseID   *uuid.UUID               `json:"to_warehouse_id,omitempty"`
	ReferenceID     *uuid.UUID               `json:"reference_id,omitempty"`
	ReferenceType   string                   `json:"reference_type,omitempty"`
	Notes           string                   `json:"notes,omitempty"`
	CreatedBy       uuid.UUID                `json:"created_by"`
	CreatedAt       time.Time                `json:"created_at"`
}

func NewStockMovement(
	tenantID uuid.UUID,
	stockItemID uuid.UUID,
	movementType valueobject.MovementType,
	qty decimal.Decimal,
	fromWarehouse, toWarehouse *uuid.UUID,
	createdBy uuid.UUID,
	notes string,
) (*StockMovement, error) {
	if qty.LessThanOrEqual(decimal.Zero) {
		return nil, ErrInvalidQuantity
	}

	switch movementType {
	case valueobject.MovementReceive:
		if toWarehouse == nil {
			return nil, ErrWarehouseRequired
		}
	case valueobject.MovementIssue:
		if fromWarehouse == nil {
			return nil, ErrWarehouseRequired
		}
	case valueobject.MovementTransfer:
		if fromWarehouse == nil || toWarehouse == nil {
			return nil, ErrWarehouseRequired
		}
	case valueobject.MovementAdjust:
		if fromWarehouse == nil && toWarehouse == nil {
			return nil, ErrWarehouseRequired
		}
	}

	return &StockMovement{
		ID:              uuid.New(),
		TenantID:        tenantID,
		StockItemID:     stockItemID,
		MovementType:    movementType,
		Quantity:        qty,
		FromWarehouseID: fromWarehouse,
		ToWarehouseID:   toWarehouse,
		CreatedBy:       createdBy,
		Notes:           notes,
		CreatedAt:       time.Now().UTC(),
	}, nil
}
