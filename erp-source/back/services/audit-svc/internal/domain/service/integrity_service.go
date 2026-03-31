package service

import (
	"context"
	"fmt"
	"time"

	"github.com/erp/audit-svc/internal/domain/entity"
	"github.com/erp/audit-svc/internal/domain/repository"
)

// IntegrityService verifies the SHA-256 hash chain for tamper detection.
type IntegrityService struct {
	repo repository.AuditRepository
}

func NewIntegrityService(repo repository.AuditRepository) *IntegrityService {
	return &IntegrityService{repo: repo}
}

// IntegrityResult holds the outcome of a hash chain verification.
type IntegrityResult struct {
	Valid          bool      `json:"valid"`
	TotalChecked   int       `json:"total_checked"`
	FirstEntry     string    `json:"first_entry_id,omitempty"`
	LastEntry      string    `json:"last_entry_id,omitempty"`
	BrokenAt       string    `json:"broken_at_id,omitempty"`
	BrokenExpected string    `json:"broken_expected_hash,omitempty"`
	BrokenActual   string    `json:"broken_actual_hash,omitempty"`
	CheckedAt      time.Time `json:"checked_at"`
}

// VerifyChain verifies the integrity of the hash chain for a tenant within a date range.
func (s *IntegrityService) VerifyChain(ctx context.Context, tenantID string, from, to time.Time) (*IntegrityResult, error) {
	entries, err := s.repo.GetEntriesByHashChain(ctx, tenantID, from, to)
	if err != nil {
		return nil, fmt.Errorf("failed to get entries for verification: %w", err)
	}

	result := &IntegrityResult{
		Valid:        true,
		TotalChecked: len(entries),
		CheckedAt:    time.Now().UTC(),
	}

	if len(entries) == 0 {
		return result, nil
	}

	result.FirstEntry = entries[0].ID
	result.LastEntry = entries[len(entries)-1].ID

	for i := 1; i < len(entries); i++ {
		current := entries[i]
		previous := entries[i-1]

		// Verify the current entry's previous_hash matches the previous entry's hash
		if current.PreviousHash != previous.Hash {
			result.Valid = false
			result.BrokenAt = current.ID
			result.BrokenExpected = previous.Hash
			result.BrokenActual = current.PreviousHash
			return result, nil
		}

		// Verify the entry's hash is correct by recomputing it
		recomputed := current.ComputeHash()
		if recomputed != current.Hash {
			result.Valid = false
			result.BrokenAt = current.ID
			result.BrokenExpected = recomputed
			result.BrokenActual = current.Hash
			return result, nil
		}
	}

	// Also verify the first entry's hash
	recomputed := entries[0].ComputeHash()
	if recomputed != entries[0].Hash {
		result.Valid = false
		result.BrokenAt = entries[0].ID
		result.BrokenExpected = recomputed
		result.BrokenActual = entries[0].Hash
	}

	return result, nil
}

// VerifyEntry verifies a single entry's hash is valid.
func (s *IntegrityService) VerifyEntry(entry *entity.AuditEntry) bool {
	return entry.ComputeHash() == entry.Hash
}
