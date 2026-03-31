package usecase

import (
	"context"
	"log"

	"github.com/erp/inventory-svc/internal/application/port"
	"github.com/erp/inventory-svc/internal/domain/repository"
	"github.com/erp/inventory-svc/internal/domain/service"
)

type CheckReorderLevelUseCase struct {
	stockRepo repository.StockRepository
	publisher port.EventPublisher
}

func NewCheckReorderLevelUseCase(
	stockRepo repository.StockRepository,
	publisher port.EventPublisher,
) *CheckReorderLevelUseCase {
	return &CheckReorderLevelUseCase{
		stockRepo: stockRepo,
		publisher: publisher,
	}
}

// Execute checks all stock items across all tenants for reorder levels.
func (uc *CheckReorderLevelUseCase) Execute(ctx context.Context) error {
	items, err := uc.stockRepo.GetAllBelowReorder(ctx)
	if err != nil {
		return err
	}

	reorderSvc := service.NewReorderService(uc.stockRepo, uc.publisher)

	for _, item := range items {
		if err := reorderSvc.CheckAndEmit(ctx, item); err != nil {
			log.Printf("reorder check failed for item %s: %v", item.SKU, err)
		}
	}

	return nil
}
