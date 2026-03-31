package dto

import "time"

// SearchRequest represents an audit search query.
type SearchRequest struct {
	Query         string `json:"query" query:"query"`
	AggregateID   string `json:"aggregate_id" query:"aggregate_id"`
	AggregateType string `json:"aggregate_type" query:"aggregate_type"`
	UserID        string `json:"user_id" query:"user_id"`
	EventType     string `json:"event_type" query:"event_type"`
	Action        string `json:"action" query:"action"`
	From          string `json:"from" query:"from"`
	To            string `json:"to" query:"to"`
	Offset        int    `json:"offset" query:"offset"`
	Limit         int    `json:"limit" query:"limit"`
	SortField     string `json:"sort_field" query:"sort_field"`
	SortOrder     string `json:"sort_order" query:"sort_order"`
}

// VerifyIntegrityRequest represents an integrity verification query.
type VerifyIntegrityRequest struct {
	From string `json:"from" query:"from"`
	To   string `json:"to" query:"to"`
}

// AuditEntryResponse represents an audit entry in API responses.
type AuditEntryResponse struct {
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

// PaginatedResponse wraps paginated results.
type PaginatedResponse struct {
	Data    interface{} `json:"data"`
	Total   int64       `json:"total"`
	Offset  int         `json:"offset"`
	Limit   int         `json:"limit"`
}
