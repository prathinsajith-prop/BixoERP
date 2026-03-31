package usecase

import (
	"context"
	"fmt"

	"github.com/erp/audit-svc/internal/domain/repository"
)

// SearchAuditUseCase handles full-text search and filtered queries over audit entries.
type SearchAuditUseCase struct {
	repo repository.AuditRepository
}

func NewSearchAuditUseCase(repo repository.AuditRepository) *SearchAuditUseCase {
	return &SearchAuditUseCase{repo: repo}
}

// Execute performs a search with the given parameters.
func (uc *SearchAuditUseCase) Execute(ctx context.Context, params repository.SearchParams) (*repository.SearchResult, error) {
	if params.Limit <= 0 {
		params.Limit = 20
	}
	if params.Limit > 200 {
		params.Limit = 200
	}
	if params.SortField == "" {
		params.SortField = "timestamp"
	}
	if params.SortOrder == "" {
		params.SortOrder = "desc"
	}

	result, err := uc.repo.Search(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("audit search failed: %w", err)
	}

	return result, nil
}

// FindByEntity returns audit entries for a specific entity.
func (uc *SearchAuditUseCase) FindByEntity(ctx context.Context, tenantID, aggregateType, aggregateID string, offset, limit int) (*repository.SearchResult, error) {
	if limit <= 0 {
		limit = 20
	}
	return uc.repo.FindByEntity(ctx, tenantID, aggregateType, aggregateID, offset, limit)
}

// FindByUser returns audit entries for a specific user.
func (uc *SearchAuditUseCase) FindByUser(ctx context.Context, tenantID, userID string, offset, limit int) (*repository.SearchResult, error) {
	if limit <= 0 {
		limit = 20
	}
	return uc.repo.FindByUser(ctx, tenantID, userID, offset, limit)
}
