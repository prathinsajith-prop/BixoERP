package usecase

import (
	"context"
	"encoding/json"
	"time"

	"github.com/erp/inventory-svc/internal/application/port"
	"github.com/erp/inventory-svc/internal/domain/entity"
	"github.com/erp/inventory-svc/internal/domain/repository"
	"github.com/erp/inventory-svc/internal/domain/service"
	"github.com/erp/inventory-svc/internal/domain/valueobject"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type IssueStockInput struct {
	TenantID    uuid.UUID
	StockItemID uuid.UUID
	WarehouseID uuid.UUID
	Quantity    decimal.Decimal
	UserID      uuid.UUID
	Notes       string
}

type IssueStockUseCase struct {
	stockRepo    repository.StockRepository
	movementRepo repository.MovementRepository
	publisher    port.EventPublisher
	cache        port.CachePort
	reorderSvc   *service.ReorderService
}

func NewIssueStockUseCase(
	stockRepo repository.StockRepository,
	movementRepo repository.MovementRepository,
	publisher port.EventPublisher,
	cache port.CachePort,
	reorderSvc *service.ReorderService,
) *IssueStockUseCase {
	return &IssueStockUseCase{
		stockRepo:    stockRepo,
		movementRepo: movementRepo,
		publisher:    publisher,
		cache:        cache,
		reorderSvc:   reorderSvc,
	}
}

func (uc *IssueStockUseCase) Execute(ctx context.Context, input IssueStockInput) (*entity.StockMovement, error) {
	item, err := uc.stockRepo.GetByID(ctx, input.TenantID, input.StockItemID)
	if err != nil {
		return nil, err
	}

	if err := item.Issue(input.Quantity); err != nil {
		return nil, err
	}

	fromWh := input.WarehouseID
	movement, err := entity.NewStockMovement(
		input.TenantID,
		input.StockItemID,
		valueobject.MovementIssue,
		input.Quantity,
		&fromWh,
		nil,
		input.UserID,
		input.Notes,
	)
	if err != nil {
		return nil, err
	}

	eventPayload, _ := json.Marshal(map[string]interface{}{
		"stock_item_id": item.ID,
		"tenant_id":     item.TenantID,
		"sku":           item.SKU,
		"quantity":      input.Quantity.String(),
		"warehouse_id":  input.WarehouseID,
		"movement_id":   movement.ID,
	})

	outboxEvent := &repository.OutboxEvent{
		ID:            uuid.New(),
		AggregateID:   item.ID,
		AggregateType: "StockItem",
		EventType:     "stock.issued",
		Payload:       eventPayload,
		TenantID:      input.TenantID,
	}

	err = uc.stockRepo.WithTx(ctx, func(tx repository.TxContext) error {
		if err := tx.UpdateStock(ctx, item); err != nil {
			return err
		}
		if err := tx.CreateMovement(ctx, movement); err != nil {
			return err
		}
		return tx.InsertOutboxEvent(ctx, outboxEvent)
	})
	if err != nil {
		return nil, err
	}

	cacheKey := "inventory:stock:" + item.ID.String()
	_ = uc.cache.Delete(ctx, cacheKey)

	_ = uc.reorderSvc.CheckAndEmit(ctx, item)

	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = uc.publisher.Publish(ctx, "stock.issued", item.ID.String(), eventPayload)
	}()

	return movement, nil
}
