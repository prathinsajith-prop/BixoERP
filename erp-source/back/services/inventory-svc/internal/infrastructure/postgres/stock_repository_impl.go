package postgres

import (
	"context"
	"errors"
	"strconv"
	"time"

	"github.com/erp/inventory-svc/internal/domain/entity"
	"github.com/erp/inventory-svc/internal/domain/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type stockRepository struct {
	pool *pgxpool.Pool
}

func NewStockRepository(pool *pgxpool.Pool) repository.StockRepository {
	return &stockRepository{pool: pool}
}

// Pool exposes the underlying connection pool for infrastructure-level access (e.g., idempotency checks).
func (r *stockRepository) Pool() *pgxpool.Pool {
	return r.pool
}

func (r *stockRepository) Create(ctx context.Context, item *entity.StockItem) error {
	query := `
		INSERT INTO stock_items (id, tenant_id, sku, name, description, quantity, reorder_level, unit_cost, currency, warehouse_id, category_id, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`

	_, err := r.pool.Exec(ctx, query,
		item.ID, item.TenantID, item.SKU, item.Name, item.Description,
		item.Quantity, item.ReorderLevel, item.UnitCost, item.Currency,
		item.WarehouseID, item.CategoryID, item.IsActive,
		item.CreatedAt, item.UpdatedAt,
	)
	return err
}

func (r *stockRepository) GetByID(ctx context.Context, tenantID, id uuid.UUID) (*entity.StockItem, error) {
	query := `
		SELECT id, tenant_id, sku, name, description, quantity, reorder_level, unit_cost, currency, warehouse_id, category_id, is_active, created_at, updated_at
		FROM stock_items
		WHERE id = $1 AND tenant_id = $2`

	item := &entity.StockItem{}
	err := r.pool.QueryRow(ctx, query, id, tenantID).Scan(
		&item.ID, &item.TenantID, &item.SKU, &item.Name, &item.Description,
		&item.Quantity, &item.ReorderLevel, &item.UnitCost, &item.Currency,
		&item.WarehouseID, &item.CategoryID, &item.IsActive,
		&item.CreatedAt, &item.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, entity.ErrNotFound
	}
	return item, err
}

func (r *stockRepository) GetBySKU(ctx context.Context, tenantID uuid.UUID, sku string, warehouseID uuid.UUID) (*entity.StockItem, error) {
	query := `
		SELECT id, tenant_id, sku, name, description, quantity, reorder_level, unit_cost, currency, warehouse_id, category_id, is_active, created_at, updated_at
		FROM stock_items
		WHERE tenant_id = $1 AND sku = $2 AND warehouse_id = $3`

	item := &entity.StockItem{}
	err := r.pool.QueryRow(ctx, query, tenantID, sku, warehouseID).Scan(
		&item.ID, &item.TenantID, &item.SKU, &item.Name, &item.Description,
		&item.Quantity, &item.ReorderLevel, &item.UnitCost, &item.Currency,
		&item.WarehouseID, &item.CategoryID, &item.IsActive,
		&item.CreatedAt, &item.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, entity.ErrNotFound
	}
	return item, err
}

func (r *stockRepository) List(ctx context.Context, tenantID uuid.UUID, filter repository.StockFilter) ([]*entity.StockItem, int64, error) {
	baseQuery := `FROM stock_items WHERE tenant_id = $1`
	args := []interface{}{tenantID}
	argIdx := 2

	if filter.WarehouseID != nil {
		baseQuery += ` AND warehouse_id = $` + itoa(argIdx)
		args = append(args, *filter.WarehouseID)
		argIdx++
	}
	if filter.SKU != "" {
		baseQuery += ` AND sku ILIKE $` + itoa(argIdx)
		args = append(args, "%"+filter.SKU+"%")
		argIdx++
	}
	if filter.IsActive != nil {
		baseQuery += ` AND is_active = $` + itoa(argIdx)
		args = append(args, *filter.IsActive)
		argIdx++
	}

	// Count
	var total int64
	countQuery := `SELECT COUNT(*) ` + baseQuery
	if err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	// Paginate
	page := filter.Page
	if page < 1 {
		page = 1
	}
	limit := filter.Limit
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	selectQuery := `SELECT id, tenant_id, sku, name, description, quantity, reorder_level, unit_cost, currency, warehouse_id, category_id, is_active, created_at, updated_at ` +
		baseQuery + ` ORDER BY created_at DESC LIMIT $` + itoa(argIdx) + ` OFFSET $` + itoa(argIdx+1)
	args = append(args, limit, offset)

	rows, err := r.pool.Query(ctx, selectQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []*entity.StockItem
	for rows.Next() {
		item := &entity.StockItem{}
		if err := rows.Scan(
			&item.ID, &item.TenantID, &item.SKU, &item.Name, &item.Description,
			&item.Quantity, &item.ReorderLevel, &item.UnitCost, &item.Currency,
			&item.WarehouseID, &item.CategoryID, &item.IsActive,
			&item.CreatedAt, &item.UpdatedAt,
		); err != nil {
			return nil, 0, err
		}
		items = append(items, item)
	}

	return items, total, nil
}

func (r *stockRepository) Update(ctx context.Context, item *entity.StockItem) error {
	item.UpdatedAt = time.Now().UTC()
	query := `
		UPDATE stock_items 
		SET sku = $3, name = $4, description = $5, quantity = $6, reorder_level = $7, unit_cost = $8, currency = $9, warehouse_id = $10, category_id = $11, is_active = $12, updated_at = $13
		WHERE id = $1 AND tenant_id = $2`

	tag, err := r.pool.Exec(ctx, query,
		item.ID, item.TenantID, item.SKU, item.Name, item.Description,
		item.Quantity, item.ReorderLevel, item.UnitCost, item.Currency,
		item.WarehouseID, item.CategoryID, item.IsActive, item.UpdatedAt,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return entity.ErrNotFound
	}
	return nil
}

func (r *stockRepository) Delete(ctx context.Context, tenantID, id uuid.UUID) error {
	query := `DELETE FROM stock_items WHERE id = $1 AND tenant_id = $2`
	tag, err := r.pool.Exec(ctx, query, id, tenantID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return entity.ErrNotFound
	}
	return nil
}

func (r *stockRepository) GetBelowReorder(ctx context.Context, tenantID uuid.UUID) ([]*entity.StockItem, error) {
	query := `
		SELECT id, tenant_id, sku, name, description, quantity, reorder_level, unit_cost, currency, warehouse_id, category_id, is_active, created_at, updated_at
		FROM stock_items
		WHERE tenant_id = $1 AND quantity <= reorder_level AND is_active = true`

	return r.scanItems(ctx, query, tenantID)
}

func (r *stockRepository) GetAllBelowReorder(ctx context.Context) ([]*entity.StockItem, error) {
	query := `
		SELECT id, tenant_id, sku, name, description, quantity, reorder_level, unit_cost, currency, warehouse_id, category_id, is_active, created_at, updated_at
		FROM stock_items
		WHERE quantity <= reorder_level AND is_active = true`

	return r.scanItems(ctx, query)
}

func (r *stockRepository) scanItems(ctx context.Context, query string, args ...interface{}) ([]*entity.StockItem, error) {
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []*entity.StockItem
	for rows.Next() {
		item := &entity.StockItem{}
		if err := rows.Scan(
			&item.ID, &item.TenantID, &item.SKU, &item.Name, &item.Description,
			&item.Quantity, &item.ReorderLevel, &item.UnitCost, &item.Currency,
			&item.WarehouseID, &item.CategoryID, &item.IsActive,
			&item.CreatedAt, &item.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, nil
}

// --- Transactional support with outbox ---

func (r *stockRepository) WithTx(ctx context.Context, fn func(tx repository.TxContext) error) error {
	pgTx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = pgTx.Rollback(ctx) }()

	txCtx := &txContext{tx: pgTx}
	if err := fn(txCtx); err != nil {
		return err
	}

	return pgTx.Commit(ctx)
}

type txContext struct {
	tx pgx.Tx
}

func (t *txContext) UpdateStock(ctx context.Context, item *entity.StockItem) error {
	item.UpdatedAt = time.Now().UTC()
	query := `
		UPDATE stock_items
		SET quantity = $3, unit_cost = $4, updated_at = $5
		WHERE id = $1 AND tenant_id = $2`

	_, err := t.tx.Exec(ctx, query, item.ID, item.TenantID, item.Quantity, item.UnitCost, item.UpdatedAt)
	return err
}

func (t *txContext) CreateMovement(ctx context.Context, m *entity.StockMovement) error {
	query := `
		INSERT INTO stock_movements (id, tenant_id, stock_item_id, movement_type, quantity, from_warehouse_id, to_warehouse_id, reference_id, reference_type, notes, created_by, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`

	_, err := t.tx.Exec(ctx, query,
		m.ID, m.TenantID, m.StockItemID, m.MovementType, m.Quantity,
		m.FromWarehouseID, m.ToWarehouseID, m.ReferenceID, m.ReferenceType,
		m.Notes, m.CreatedBy, m.CreatedAt,
	)
	return err
}

func (t *txContext) InsertOutboxEvent(ctx context.Context, event *repository.OutboxEvent) error {
	query := `
		INSERT INTO outbox_events (id, aggregate_id, aggregate_type, event_type, payload, tenant_id, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`

	_, err := t.tx.Exec(ctx, query,
		event.ID, event.AggregateID, event.AggregateType, event.EventType,
		event.Payload, event.TenantID, time.Now().UTC(),
	)
	return err
}

// itoa converts int to string for building parameterized queries.
func itoa(i int) string {
	return strconv.Itoa(i)
}
