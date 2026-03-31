package postgres

import (
	"context"
	"errors"

	"github.com/erp/inventory-svc/internal/domain/entity"
	"github.com/erp/inventory-svc/internal/domain/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type movementRepository struct {
	pool *pgxpool.Pool
}

func NewMovementRepository(pool *pgxpool.Pool) repository.MovementRepository {
	return &movementRepository{pool: pool}
}

func (r *movementRepository) Create(ctx context.Context, m *entity.StockMovement) error {
	query := `
		INSERT INTO stock_movements (id, tenant_id, stock_item_id, movement_type, quantity, from_warehouse_id, to_warehouse_id, reference_id, reference_type, notes, created_by, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`

	_, err := r.pool.Exec(ctx, query,
		m.ID, m.TenantID, m.StockItemID, m.MovementType, m.Quantity,
		m.FromWarehouseID, m.ToWarehouseID, m.ReferenceID, m.ReferenceType,
		m.Notes, m.CreatedBy, m.CreatedAt,
	)
	return err
}

func (r *movementRepository) GetByID(ctx context.Context, tenantID, id uuid.UUID) (*entity.StockMovement, error) {
	query := `
		SELECT id, tenant_id, stock_item_id, movement_type, quantity, from_warehouse_id, to_warehouse_id, reference_id, reference_type, notes, created_by, created_at
		FROM stock_movements
		WHERE id = $1 AND tenant_id = $2`

	m := &entity.StockMovement{}
	err := r.pool.QueryRow(ctx, query, id, tenantID).Scan(
		&m.ID, &m.TenantID, &m.StockItemID, &m.MovementType, &m.Quantity,
		&m.FromWarehouseID, &m.ToWarehouseID, &m.ReferenceID, &m.ReferenceType,
		&m.Notes, &m.CreatedBy, &m.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, entity.ErrNotFound
	}
	return m, err
}

func (r *movementRepository) ListByStockItem(ctx context.Context, tenantID, stockItemID uuid.UUID, page, limit int) ([]*entity.StockMovement, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	var total int64
	countQ := `SELECT COUNT(*) FROM stock_movements WHERE tenant_id = $1 AND stock_item_id = $2`
	if err := r.pool.QueryRow(ctx, countQ, tenantID, stockItemID).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := `
		SELECT id, tenant_id, stock_item_id, movement_type, quantity, from_warehouse_id, to_warehouse_id, reference_id, reference_type, notes, created_by, created_at
		FROM stock_movements
		WHERE tenant_id = $1 AND stock_item_id = $2
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4`

	return r.scanMovements(ctx, total, query, tenantID, stockItemID, limit, offset)
}

func (r *movementRepository) ListByWarehouse(ctx context.Context, tenantID, warehouseID uuid.UUID, page, limit int) ([]*entity.StockMovement, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	var total int64
	countQ := `SELECT COUNT(*) FROM stock_movements WHERE tenant_id = $1 AND (from_warehouse_id = $2 OR to_warehouse_id = $2)`
	if err := r.pool.QueryRow(ctx, countQ, tenantID, warehouseID).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := `
		SELECT id, tenant_id, stock_item_id, movement_type, quantity, from_warehouse_id, to_warehouse_id, reference_id, reference_type, notes, created_by, created_at
		FROM stock_movements
		WHERE tenant_id = $1 AND (from_warehouse_id = $2 OR to_warehouse_id = $2)
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4`

	return r.scanMovements(ctx, total, query, tenantID, warehouseID, limit, offset)
}

func (r *movementRepository) scanMovements(ctx context.Context, total int64, query string, args ...interface{}) ([]*entity.StockMovement, int64, error) {
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var movements []*entity.StockMovement
	for rows.Next() {
		m := &entity.StockMovement{}
		if err := rows.Scan(
			&m.ID, &m.TenantID, &m.StockItemID, &m.MovementType, &m.Quantity,
			&m.FromWarehouseID, &m.ToWarehouseID, &m.ReferenceID, &m.ReferenceType,
			&m.Notes, &m.CreatedBy, &m.CreatedAt,
		); err != nil {
			return nil, 0, err
		}
		movements = append(movements, m)
	}

	return movements, total, nil
}
