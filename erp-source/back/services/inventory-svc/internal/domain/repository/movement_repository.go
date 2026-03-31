package repository

import (
	"context"

	"github.com/erp/inventory-svc/internal/domain/entity"
	"github.com/google/uuid"
)

type MovementRepository interface {
	Create(ctx context.Context, movement *entity.StockMovement) error
	GetByID(ctx context.Context, tenantID, id uuid.UUID) (*entity.StockMovement, error)
	ListByStockItem(ctx context.Context, tenantID, stockItemID uuid.UUID, page, limit int) ([]*entity.StockMovement, int64, error)
	ListByWarehouse(ctx context.Context, tenantID, warehouseID uuid.UUID, page, limit int) ([]*entity.StockMovement, int64, error)
}
