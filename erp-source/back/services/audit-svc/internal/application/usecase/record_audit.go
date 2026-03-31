package usecase

import (
	"context"
	"fmt"
	"log"

	"github.com/erp/audit-svc/internal/domain/entity"
	"github.com/erp/audit-svc/internal/domain/repository"
)

// RecordAuditUseCase handles recording new audit entries with hash chain linking.
type RecordAuditUseCase struct {
	repo repository.AuditRepository
}

func NewRecordAuditUseCase(repo repository.AuditRepository) *RecordAuditUseCase {
	return &RecordAuditUseCase{repo: repo}
}

// RecordInput contains the data needed to create an audit entry.
type RecordInput struct {
	EventID       string
	EventType     string
	AggregateID   string
	AggregateType string
	TenantID      string
	UserID        string
	Action        string
	Source        string
	Before        map[string]interface{}
	After         map[string]interface{}
	Metadata      map[string]interface{}
}

// Execute records a new audit entry, linking it to the previous entry's hash.
func (uc *RecordAuditUseCase) Execute(ctx context.Context, input RecordInput) (*entity.AuditEntry, error) {
	// Get the last entry's hash for this tenant to maintain the chain
	previousHash := ""
	lastEntry, err := uc.repo.GetLastEntry(ctx, input.TenantID)
	if err != nil {
		log.Printf("WARN: could not get last entry for tenant %s: %v (starting new chain)", input.TenantID, err)
	} else if lastEntry != nil {
		previousHash = lastEntry.Hash
	}

	entry := entity.NewAuditEntry(
		input.EventID,
		input.EventType,
		input.AggregateID,
		input.AggregateType,
		input.TenantID,
		input.UserID,
		input.Action,
		input.Source,
		input.Before,
		input.After,
		input.Metadata,
		previousHash,
	)

	// Ensure the index exists for this tenant/month
	if err := uc.repo.EnsureIndex(ctx, entry.IndexName()); err != nil {
		return nil, fmt.Errorf("failed to ensure index: %w", err)
	}

	if err := uc.repo.Append(ctx, entry); err != nil {
		return nil, fmt.Errorf("failed to append audit entry: %w", err)
	}

	log.Printf("audit entry recorded: id=%s event=%s aggregate=%s/%s tenant=%s",
		entry.ID, entry.EventType, entry.AggregateType, entry.AggregateID, entry.TenantID)

	return entry, nil
}
