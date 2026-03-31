package repository

import (
	"context"
	"time"

	"github.com/erp/audit-svc/internal/domain/entity"
)

// SearchParams holds query parameters for audit entry searches.
type SearchParams struct {
	Query         string
	TenantID      string
	AggregateID   string
	AggregateType string
	UserID        string
	EventType     string
	Action        string
	From          time.Time
	To            time.Time
	Offset        int
	Limit         int
	SortField     string
	SortOrder     string // "asc" or "desc"
}

// SearchResult holds paginated search results.
type SearchResult struct {
	Entries    []*entity.AuditEntry `json:"entries"`
	Total      int64                `json:"total"`
	Offset     int                  `json:"offset"`
	Limit      int                  `json:"limit"`
}

// AuditRepository defines the interface for audit entry persistence.
type AuditRepository interface {
	// Append stores a new audit entry (append-only, immutable).
	Append(ctx context.Context, entry *entity.AuditEntry) error

	// Search performs full-text search with optional filters.
	Search(ctx context.Context, params SearchParams) (*SearchResult, error)

	// FindByEntity returns audit entries for a specific aggregate.
	FindByEntity(ctx context.Context, tenantID, aggregateType, aggregateID string, offset, limit int) (*SearchResult, error)

	// FindByUser returns audit entries for a specific user.
	FindByUser(ctx context.Context, tenantID, userID string, offset, limit int) (*SearchResult, error)

	// FindByDateRange returns audit entries within a date range.
	FindByDateRange(ctx context.Context, tenantID string, from, to time.Time, offset, limit int) (*SearchResult, error)

	// GetLastEntry returns the most recent audit entry for a tenant (for hash chain).
	GetLastEntry(ctx context.Context, tenantID string) (*entity.AuditEntry, error)

	// GetEntriesByHashChain returns entries in order for integrity verification.
	GetEntriesByHashChain(ctx context.Context, tenantID string, from, to time.Time) ([]*entity.AuditEntry, error)

	// EnsureIndex creates the index with proper mappings if it doesn't exist.
	EnsureIndex(ctx context.Context, indexName string) error
}
