package service

import (
	"context"
	"encoding/json"
	"log"

	"github.com/erp/inventory-svc/internal/application/port"
	"github.com/erp/inventory-svc/internal/domain/entity"
	"github.com/erp/inventory-svc/internal/domain/repository"
	"github.com/google/uuid"
)

type ReorderService struct {
	stockRepo repository.StockRepository
	publisher port.EventPublisher
}

func NewReorderService(stockRepo repository.StockRepository, publisher port.EventPublisher) *ReorderService {
	return &ReorderService{
		stockRepo: stockRepo,
		publisher: publisher,
	}
}

type ReorderEvent struct {
	StockItemID  uuid.UUID `json:"stock_item_id"`
	TenantID     uuid.UUID `json:"tenant_id"`
	SKU          string    `json:"sku"`
	Name         string    `json:"name"`
	Quantity     string    `json:"quantity"`
	ReorderLevel string    `json:"reorder_level"`
	WarehouseID  uuid.UUID `json:"warehouse_id"`
}

func (s *ReorderService) CheckAndEmit(ctx context.Context, item *entity.StockItem) error {
	if !item.IsBelowReorder() {
		return nil
	}

	event := ReorderEvent{
		StockItemID:  item.ID,
		TenantID:     item.TenantID,
		SKU:          item.SKU,
		Name:         item.Name,
		Quantity:     item.Quantity.String(),
		ReorderLevel: item.ReorderLevel.String(),
		WarehouseID:  item.WarehouseID,
	}

	payload, err := json.Marshal(event)
	if err != nil {
		return err
	}

	if err := s.publisher.Publish(ctx, "stock.below.reorder", item.ID.String(), payload); err != nil {
		log.Printf("failed to publish reorder event for %s: %v", item.SKU, err)
		return err
	}

	return nil
}
