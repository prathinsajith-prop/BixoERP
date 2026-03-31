package repository

import (
	"context"

	"github.com/erp/inventory-svc/internal/domain/entity"
	"github.com/google/uuid"
)

type StockRepository interface {
	Create(ctx context.Context, item *entity.StockItem) error
	GetByID(ctx context.Context, tenantID, id uuid.UUID) (*entity.StockItem, error)
	GetBySKU(ctx context.Context, tenantID uuid.UUID, sku string, warehouseID uuid.UUID) (*entity.StockItem, error)
	List(ctx context.Context, tenantID uuid.UUID, filter StockFilter) ([]*entity.StockItem, int64, error)
	Update(ctx context.Context, item *entity.StockItem) error
	Delete(ctx context.Context, tenantID, id uuid.UUID) error
	GetBelowReorder(ctx context.Context, tenantID uuid.UUID) ([]*entity.StockItem, error)
	GetAllBelowReorder(ctx context.Context) ([]*entity.StockItem, error)

	// WithTx runs fn within a transaction, inserting an outbox event atomically.
	WithTx(ctx context.Context, fn func(tx TxContext) error) error
}

type TxContext interface {
	UpdateStock(ctx context.Context, item *entity.StockItem) error
	CreateMovement(ctx context.Context, movement *entity.StockMovement) error
	InsertOutboxEvent(ctx context.Context, event *OutboxEvent) error
}

type OutboxEvent struct {
	ID            uuid.UUID `json:"id"`
	AggregateID   uuid.UUID `json:"aggregate_id"`
	AggregateType string    `json:"aggregate_type"`
	EventType     string    `json:"event_type"`
	Payload       []byte    `json:"payload"`
	TenantID      uuid.UUID `json:"tenant_id"`
}

type StockFilter struct {
	WarehouseID *uuid.UUID
	SKU         string
	IsActive    *bool
	Page        int
	Limit       int
}
