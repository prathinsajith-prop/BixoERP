package usecase

import (
	"context"
	"fmt"
	"time"

	"github.com/erp/audit-svc/internal/domain/service"
)

// VerifyIntegrityUseCase checks the hash chain integrity for a tenant.
type VerifyIntegrityUseCase struct {
	integritySvc *service.IntegrityService
}

func NewVerifyIntegrityUseCase(integritySvc *service.IntegrityService) *VerifyIntegrityUseCase {
	return &VerifyIntegrityUseCase{integritySvc: integritySvc}
}

// Execute verifies the hash chain for the given tenant and date range.
func (uc *VerifyIntegrityUseCase) Execute(ctx context.Context, tenantID string, from, to time.Time) (*service.IntegrityResult, error) {
	if from.IsZero() {
		from = time.Now().AddDate(0, -1, 0) // default: last month
	}
	if to.IsZero() {
		to = time.Now()
	}
	if to.Before(from) {
		return nil, fmt.Errorf("'to' date must be after 'from' date")
	}

	result, err := uc.integritySvc.VerifyChain(ctx, tenantID, from, to)
	if err != nil {
		return nil, fmt.Errorf("integrity verification failed: %w", err)
	}

	return result, nil
}
