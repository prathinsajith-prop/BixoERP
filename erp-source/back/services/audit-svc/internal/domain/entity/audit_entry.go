package entity

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// AuditEntry represents an immutable audit log entry.
// Each entry contains a hash of the previous entry for tamper detection.
type AuditEntry struct {
	ID            string                 `json:"id"`
	EventID       string                 `json:"event_id"`
	EventType     string                 `json:"event_type"`
	AggregateID   string                 `json:"aggregate_id"`
	AggregateType string                 `json:"aggregate_type"`
	TenantID      string                 `json:"tenant_id"`
	UserID        string                 `json:"user_id"`
	Action        string                 `json:"action"`
	Before        map[string]interface{} `json:"before,omitempty"`
	After         map[string]interface{} `json:"after,omitempty"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
	Timestamp     time.Time              `json:"timestamp"`
	PreviousHash  string                 `json:"previous_hash"`
	Hash          string                 `json:"hash"`
	Source        string                 `json:"source"`
}

// NewAuditEntry creates a new audit entry with a generated ID and timestamp.
func NewAuditEntry(
	eventID, eventType, aggregateID, aggregateType, tenantID, userID, action, source string,
	before, after, metadata map[string]interface{},
	previousHash string,
) *AuditEntry {
	entry := &AuditEntry{
		ID:            uuid.New().String(),
		EventID:       eventID,
		EventType:     eventType,
		AggregateID:   aggregateID,
		AggregateType: aggregateType,
		TenantID:      tenantID,
		UserID:        userID,
		Action:        action,
		Before:        before,
		After:         after,
		Metadata:      metadata,
		Timestamp:     time.Now().UTC(),
		PreviousHash:  previousHash,
		Source:        source,
	}
	entry.Hash = entry.ComputeHash()
	return entry
}

// ComputeHash calculates a SHA-256 hash of the entry's content including the previous hash.
func (e *AuditEntry) ComputeHash() string {
	payload := struct {
		EventID       string                 `json:"event_id"`
		EventType     string                 `json:"event_type"`
		AggregateID   string                 `json:"aggregate_id"`
		AggregateType string                 `json:"aggregate_type"`
		TenantID      string                 `json:"tenant_id"`
		UserID        string                 `json:"user_id"`
		Action        string                 `json:"action"`
		Before        map[string]interface{} `json:"before,omitempty"`
		After         map[string]interface{} `json:"after,omitempty"`
		Timestamp     time.Time              `json:"timestamp"`
		PreviousHash  string                 `json:"previous_hash"`
	}{
		EventID:       e.EventID,
		EventType:     e.EventType,
		AggregateID:   e.AggregateID,
		AggregateType: e.AggregateType,
		TenantID:      e.TenantID,
		UserID:        e.UserID,
		Action:        e.Action,
		Before:        e.Before,
		After:         e.After,
		Timestamp:     e.Timestamp,
		PreviousHash:  e.PreviousHash,
	}

	data, _ := json.Marshal(payload)
	sum := sha256.Sum256(data)
	return hex.EncodeToString(sum[:])
}

// IndexName returns the monthly Elasticsearch index for this entry.
func (e *AuditEntry) IndexName() string {
	return "audit-" + e.TenantID + "-" + e.Timestamp.Format("2006-01")
}
