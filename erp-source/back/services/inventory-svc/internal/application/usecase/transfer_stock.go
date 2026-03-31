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

type TransferStockInput struct {
	TenantID        uuid.UUID
	StockItemID     uuid.UUID
	FromWarehouseID uuid.UUID
	ToWarehouseID   uuid.UUID
	Quantity        decimal.Decimal
	UserID          uuid.UUID
	Notes           string
}

type TransferStockUseCase struct {
	stockRepo    repository.StockRepository
	movementRepo repository.MovementRepository
	publisher    port.EventPublisher
	cache        port.CachePort
	reorderSvc   *service.ReorderService
}

func NewTransferStockUseCase(
	stockRepo repository.StockRepository,
	movementRepo repository.MovementRepository,
	publisher port.EventPublisher,
	cache port.CachePort,
	reorderSvc *service.ReorderService,
) *TransferStockUseCase {
	return &TransferStockUseCase{
		stockRepo:    stockRepo,
		movementRepo: movementRepo,
		publisher:    publisher,
		cache:        cache,
		reorderSvc:   reorderSvc,
	}
}

func (uc *TransferStockUseCase) Execute(ctx context.Context, input TransferStockInput) (*entity.StockMovement, error) {
	// Issue from source warehouse
	sourceItem, err := uc.stockRepo.GetByID(ctx, input.TenantID, input.StockItemID)
	if err != nil {
		return nil, err
	}

	if err := sourceItem.Issue(input.Quantity); err != nil {
		return nil, err
	}

	// Find or create stock at destination (same SKU)
	destItem, err := uc.stockRepo.GetBySKU(ctx, input.TenantID, sourceItem.SKU, input.ToWarehouseID)
	if err != nil {
		// Create stock item at destination warehouse
		destItem = entity.NewStockItem(
			input.TenantID,
			sourceItem.SKU,
			sourceItem.Name,
			input.ToWarehouseID,
			sourceItem.ReorderLevel,
			sourceItem.Currency,
		)
		destItem.Description = sourceItem.Description
		if err := uc.stockRepo.Create(ctx, destItem); err != nil {
			return nil, err
		}
	}

	if err := destItem.Receive(input.Quantity); err != nil {
		return nil, err
	}

	fromWh := input.FromWarehouseID
	toWh := input.ToWarehouseID
	movement, err := entity.NewStockMovement(
		input.TenantID,
		input.StockItemID,
		valueobject.MovementTransfer,
		input.Quantity,
		&fromWh,
		&toWh,
		input.UserID,
		input.Notes,
	)
	if err != nil {
		return nil, err
	}

	eventPayload, _ := json.Marshal(map[string]interface{}{
		"stock_item_id":     sourceItem.ID,
		"tenant_id":         input.TenantID,
		"sku":               sourceItem.SKU,
		"quantity":          input.Quantity.String(),
		"from_warehouse_id": input.FromWarehouseID,
		"to_warehouse_id":   input.ToWarehouseID,
		"movement_id":       movement.ID,
	})

	outboxEvent := &repository.OutboxEvent{
		ID:            uuid.New(),
		AggregateID:   sourceItem.ID,
		AggregateType: "StockItem",
		EventType:     "stock.transferred",
		Payload:       eventPayload,
		TenantID:      input.TenantID,
	}

	err = uc.stockRepo.WithTx(ctx, func(tx repository.TxContext) error {
		if err := tx.UpdateStock(ctx, sourceItem); err != nil {
			return err
		}
		if err := tx.UpdateStock(ctx, destItem); err != nil {
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

	_ = uc.cache.Delete(ctx, "inventory:stock:"+sourceItem.ID.String())
	_ = uc.cache.Delete(ctx, "inventory:stock:"+destItem.ID.String())

	_ = uc.reorderSvc.CheckAndEmit(ctx, sourceItem)

	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = uc.publisher.Publish(ctx, "stock.transferred", sourceItem.ID.String(), eventPayload)
	}()

	return movement, nil
}
