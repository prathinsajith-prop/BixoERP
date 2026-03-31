package elasticsearch

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"strings"
	"sync"
	"time"

	"github.com/elastic/go-elasticsearch/v8"
	"github.com/erp/audit-svc/internal/domain/entity"
	"github.com/erp/audit-svc/internal/domain/repository"
)

// AuditRepositoryImpl implements AuditRepository using Elasticsearch.
type AuditRepositoryImpl struct {
	client       *elasticsearch.Client
	createdIndex sync.Map // track created indices to avoid repeated creation
}

func NewAuditRepository(client *elasticsearch.Client) *AuditRepositoryImpl {
	return &AuditRepositoryImpl{client: client}
}

// indexMapping defines the Elasticsearch index mapping for audit entries.
const indexMapping = `{
  "settings": {
    "number_of_shards": 2,
    "number_of_replicas": 1,
    "index.mapping.total_fields.limit": 2000,
    "analysis": {
      "analyzer": {
        "audit_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "asciifolding"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "id":              { "type": "keyword" },
      "event_id":        { "type": "keyword" },
      "event_type":      { "type": "keyword" },
      "aggregate_id":    { "type": "keyword" },
      "aggregate_type":  { "type": "keyword" },
      "tenant_id":       { "type": "keyword" },
      "user_id":         { "type": "keyword" },
      "action":          { "type": "keyword" },
      "before":          { "type": "object", "enabled": true },
      "after":           { "type": "object", "enabled": true },
      "metadata":        { "type": "object", "enabled": true },
      "timestamp":       { "type": "date" },
      "previous_hash":   { "type": "keyword" },
      "hash":            { "type": "keyword" },
      "source":          { "type": "keyword" },
      "search_text": {
        "type": "text",
        "analyzer": "audit_analyzer"
      }
    }
  }
}`

// EnsureIndex creates an index with proper mappings if it doesn't already exist.
func (r *AuditRepositoryImpl) EnsureIndex(ctx context.Context, indexName string) error {
	if _, ok := r.createdIndex.Load(indexName); ok {
		return nil
	}

	res, err := r.client.Indices.Exists([]string{indexName})
	if err != nil {
		return fmt.Errorf("failed to check index existence: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode == 200 {
		r.createdIndex.Store(indexName, true)
		return nil
	}

	res, err = r.client.Indices.Create(
		indexName,
		r.client.Indices.Create.WithBody(strings.NewReader(indexMapping)),
		r.client.Indices.Create.WithContext(ctx),
	)
	if err != nil {
		return fmt.Errorf("failed to create index %s: %w", indexName, err)
	}
	defer res.Body.Close()

	if res.IsError() {
		body, _ := io.ReadAll(res.Body)
		// Ignore "resource_already_exists_exception"
		if strings.Contains(string(body), "resource_already_exists_exception") {
			r.createdIndex.Store(indexName, true)
			return nil
		}
		return fmt.Errorf("failed to create index %s: %s", indexName, string(body))
	}

	r.createdIndex.Store(indexName, true)
	return nil
}

// Append stores a new audit entry (append-only).
func (r *AuditRepositoryImpl) Append(ctx context.Context, entry *entity.AuditEntry) error {
	// Build a search_text field for full-text search
	doc := map[string]interface{}{
		"id":             entry.ID,
		"event_id":       entry.EventID,
		"event_type":     entry.EventType,
		"aggregate_id":   entry.AggregateID,
		"aggregate_type": entry.AggregateType,
		"tenant_id":      entry.TenantID,
		"user_id":        entry.UserID,
		"action":         entry.Action,
		"before":         entry.Before,
		"after":          entry.After,
		"metadata":       entry.Metadata,
		"timestamp":      entry.Timestamp,
		"previous_hash":  entry.PreviousHash,
		"hash":           entry.Hash,
		"source":         entry.Source,
		"search_text":    buildSearchText(entry),
	}

	data, err := json.Marshal(doc)
	if err != nil {
		return fmt.Errorf("failed to marshal audit entry: %w", err)
	}

	res, err := r.client.Index(
		entry.IndexName(),
		bytes.NewReader(data),
		r.client.Index.WithDocumentID(entry.ID),
		r.client.Index.WithContext(ctx),
		r.client.Index.WithRefresh("true"),
	)
	if err != nil {
		return fmt.Errorf("failed to index audit entry: %w", err)
	}
	defer res.Body.Close()

	if res.IsError() {
		body, _ := io.ReadAll(res.Body)
		return fmt.Errorf("elasticsearch index error: %s", string(body))
	}

	return nil
}

// Search performs full-text search with optional filters.
func (r *AuditRepositoryImpl) Search(ctx context.Context, params repository.SearchParams) (*repository.SearchResult, error) {
	must := []map[string]interface{}{
		{"term": map[string]interface{}{"tenant_id": params.TenantID}},
	}

	if params.Query != "" {
		must = append(must, map[string]interface{}{
			"match": map[string]interface{}{
				"search_text": map[string]interface{}{
					"query":    params.Query,
					"operator": "and",
				},
			},
		})
	}
	if params.AggregateID != "" {
		must = append(must, map[string]interface{}{
			"term": map[string]interface{}{"aggregate_id": params.AggregateID},
		})
	}
	if params.AggregateType != "" {
		must = append(must, map[string]interface{}{
			"term": map[string]interface{}{"aggregate_type": params.AggregateType},
		})
	}
	if params.UserID != "" {
		must = append(must, map[string]interface{}{
			"term": map[string]interface{}{"user_id": params.UserID},
		})
	}
	if params.EventType != "" {
		must = append(must, map[string]interface{}{
			"term": map[string]interface{}{"event_type": params.EventType},
		})
	}
	if params.Action != "" {
		must = append(must, map[string]interface{}{
			"term": map[string]interface{}{"action": params.Action},
		})
	}

	if !params.From.IsZero() || !params.To.IsZero() {
		rangeFilter := map[string]interface{}{}
		if !params.From.IsZero() {
			rangeFilter["gte"] = params.From.Format(time.RFC3339)
		}
		if !params.To.IsZero() {
			rangeFilter["lte"] = params.To.Format(time.RFC3339)
		}
		must = append(must, map[string]interface{}{
			"range": map[string]interface{}{"timestamp": rangeFilter},
		})
	}

	query := map[string]interface{}{
		"query": map[string]interface{}{
			"bool": map[string]interface{}{
				"must": must,
			},
		},
		"sort": []map[string]interface{}{
			{params.SortField: map[string]interface{}{"order": params.SortOrder}},
		},
		"from": params.Offset,
		"size": params.Limit,
	}

	return r.executeSearch(ctx, params.TenantID, query)
}

// FindByEntity returns audit entries for a specific aggregate.
func (r *AuditRepositoryImpl) FindByEntity(ctx context.Context, tenantID, aggregateType, aggregateID string, offset, limit int) (*repository.SearchResult, error) {
	query := map[string]interface{}{
		"query": map[string]interface{}{
			"bool": map[string]interface{}{
				"must": []map[string]interface{}{
					{"term": map[string]interface{}{"tenant_id": tenantID}},
					{"term": map[string]interface{}{"aggregate_type": aggregateType}},
					{"term": map[string]interface{}{"aggregate_id": aggregateID}},
				},
			},
		},
		"sort": []map[string]interface{}{
			{"timestamp": map[string]interface{}{"order": "desc"}},
		},
		"from": offset,
		"size": limit,
	}

	return r.executeSearch(ctx, tenantID, query)
}

// FindByUser returns audit entries for a specific user.
func (r *AuditRepositoryImpl) FindByUser(ctx context.Context, tenantID, userID string, offset, limit int) (*repository.SearchResult, error) {
	query := map[string]interface{}{
		"query": map[string]interface{}{
			"bool": map[string]interface{}{
				"must": []map[string]interface{}{
					{"term": map[string]interface{}{"tenant_id": tenantID}},
					{"term": map[string]interface{}{"user_id": userID}},
				},
			},
		},
		"sort": []map[string]interface{}{
			{"timestamp": map[string]interface{}{"order": "desc"}},
		},
		"from": offset,
		"size": limit,
	}

	return r.executeSearch(ctx, tenantID, query)
}

// FindByDateRange returns audit entries within a date range.
func (r *AuditRepositoryImpl) FindByDateRange(ctx context.Context, tenantID string, from, to time.Time, offset, limit int) (*repository.SearchResult, error) {
	query := map[string]interface{}{
		"query": map[string]interface{}{
			"bool": map[string]interface{}{
				"must": []map[string]interface{}{
					{"term": map[string]interface{}{"tenant_id": tenantID}},
					{
						"range": map[string]interface{}{
							"timestamp": map[string]interface{}{
								"gte": from.Format(time.RFC3339),
								"lte": to.Format(time.RFC3339),
							},
						},
					},
				},
			},
		},
		"sort": []map[string]interface{}{
			{"timestamp": map[string]interface{}{"order": "desc"}},
		},
		"from": offset,
		"size": limit,
	}

	return r.executeSearch(ctx, tenantID, query)
}

// GetLastEntry returns the most recent audit entry for a tenant.
func (r *AuditRepositoryImpl) GetLastEntry(ctx context.Context, tenantID string) (*entity.AuditEntry, error) {
	query := map[string]interface{}{
		"query": map[string]interface{}{
			"term": map[string]interface{}{"tenant_id": tenantID},
		},
		"sort": []map[string]interface{}{
			{"timestamp": map[string]interface{}{"order": "desc"}},
		},
		"size": 1,
	}

	// Search across all audit indices for this tenant
	indexPattern := "audit-" + tenantID + "-*"

	data, err := json.Marshal(query)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal query: %w", err)
	}

	res, err := r.client.Search(
		r.client.Search.WithContext(ctx),
		r.client.Search.WithIndex(indexPattern),
		r.client.Search.WithBody(bytes.NewReader(data)),
		r.client.Search.WithIgnoreUnavailable(true),
	)
	if err != nil {
		return nil, fmt.Errorf("elasticsearch search error: %w", err)
	}
	defer res.Body.Close()

	if res.IsError() {
		body, _ := io.ReadAll(res.Body)
		errStr := string(body)
		// No indices exist yet — return nil (first entry)
		if strings.Contains(errStr, "index_not_found_exception") || strings.Contains(errStr, "no such index") {
			return nil, nil
		}
		return nil, fmt.Errorf("elasticsearch error: %s", errStr)
	}

	var result searchResponse
	if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if len(result.Hits.Hits) == 0 {
		return nil, nil
	}

	return parseHitToEntry(result.Hits.Hits[0])
}

// GetEntriesByHashChain returns entries ordered by timestamp for integrity verification.
func (r *AuditRepositoryImpl) GetEntriesByHashChain(ctx context.Context, tenantID string, from, to time.Time) ([]*entity.AuditEntry, error) {
	var entries []*entity.AuditEntry
	var searchAfter []interface{}

	indexPattern := "audit-" + tenantID + "-*"

	for {
		query := map[string]interface{}{
			"query": map[string]interface{}{
				"bool": map[string]interface{}{
					"must": []map[string]interface{}{
						{"term": map[string]interface{}{"tenant_id": tenantID}},
						{
							"range": map[string]interface{}{
								"timestamp": map[string]interface{}{
									"gte": from.Format(time.RFC3339),
									"lte": to.Format(time.RFC3339),
								},
							},
						},
					},
				},
			},
			"sort": []map[string]interface{}{
				{"timestamp": map[string]interface{}{"order": "asc"}},
				{"id": map[string]interface{}{"order": "asc"}},
			},
			"size": 1000,
		}

		if searchAfter != nil {
			query["search_after"] = searchAfter
		}

		data, err := json.Marshal(query)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal query: %w", err)
		}

		res, err := r.client.Search(
			r.client.Search.WithContext(ctx),
			r.client.Search.WithIndex(indexPattern),
			r.client.Search.WithBody(bytes.NewReader(data)),
			r.client.Search.WithIgnoreUnavailable(true),
		)
		if err != nil {
			return nil, fmt.Errorf("elasticsearch search error: %w", err)
		}
		defer res.Body.Close()

		if res.IsError() {
			body, _ := io.ReadAll(res.Body)
			if strings.Contains(string(body), "index_not_found_exception") {
				return entries, nil
			}
			return nil, fmt.Errorf("elasticsearch error: %s", string(body))
		}

		var result searchResponse
		if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
			return nil, fmt.Errorf("failed to decode response: %w", err)
		}

		if len(result.Hits.Hits) == 0 {
			break
		}

		for _, hit := range result.Hits.Hits {
			entry, err := parseHitToEntry(hit)
			if err != nil {
				return nil, err
			}
			entries = append(entries, entry)
		}

		lastHit := result.Hits.Hits[len(result.Hits.Hits)-1]
		searchAfter = lastHit.Sort

		if len(result.Hits.Hits) < 1000 {
			break
		}
	}

	return entries, nil
}

// executeSearch executes a search query against tenant-specific audit indices.
func (r *AuditRepositoryImpl) executeSearch(ctx context.Context, tenantID string, query map[string]interface{}) (*repository.SearchResult, error) {
	indexPattern := "audit-" + tenantID + "-*"

	data, err := json.Marshal(query)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal query: %w", err)
	}

	res, err := r.client.Search(
		r.client.Search.WithContext(ctx),
		r.client.Search.WithIndex(indexPattern),
		r.client.Search.WithBody(bytes.NewReader(data)),
		r.client.Search.WithTrackTotalHits(true),
		r.client.Search.WithIgnoreUnavailable(true),
	)
	if err != nil {
		return nil, fmt.Errorf("elasticsearch search error: %w", err)
	}
	defer res.Body.Close()

	if res.IsError() {
		body, _ := io.ReadAll(res.Body)
		if strings.Contains(string(body), "index_not_found_exception") {
			return &repository.SearchResult{Entries: []*entity.AuditEntry{}, Total: 0}, nil
		}
		return nil, fmt.Errorf("elasticsearch error: %s", string(body))
	}

	var result searchResponse
	if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	entries := make([]*entity.AuditEntry, 0, len(result.Hits.Hits))
	for _, hit := range result.Hits.Hits {
		entry, err := parseHitToEntry(hit)
		if err != nil {
			return nil, err
		}
		entries = append(entries, entry)
	}

	offset := 0
	limit := 20
	if from, ok := query["from"]; ok {
		if v, ok := from.(int); ok {
			offset = v
		}
	}
	if size, ok := query["size"]; ok {
		if v, ok := size.(int); ok {
			limit = v
		}
	}

	return &repository.SearchResult{
		Entries: entries,
		Total:   result.Hits.Total.Value,
		Offset:  offset,
		Limit:   limit,
	}, nil
}

// --- Response structs ---

type searchResponse struct {
	Hits struct {
		Total struct {
			Value int64 `json:"value"`
		} `json:"total"`
		Hits []searchHit `json:"hits"`
	} `json:"hits"`
}

type searchHit struct {
	Source json.RawMessage `json:"_source"`
	Sort   []interface{}   `json:"sort"`
}

func parseHitToEntry(hit searchHit) (*entity.AuditEntry, error) {
	var entry entity.AuditEntry
	if err := json.Unmarshal(hit.Source, &entry); err != nil {
		return nil, fmt.Errorf("failed to unmarshal audit entry: %w", err)
	}
	return &entry, nil
}

// buildSearchText constructs a searchable text field from the entry.
func buildSearchText(entry *entity.AuditEntry) string {
	parts := []string{
		entry.EventType,
		entry.AggregateType,
		entry.AggregateID,
		entry.Action,
		entry.Source,
	}

	// Include flattened before/after values
	for _, m := range []map[string]interface{}{entry.Before, entry.After, entry.Metadata} {
		for k, v := range m {
			parts = append(parts, k)
			parts = append(parts, fmt.Sprintf("%v", v))
		}
	}

	return strings.Join(parts, " ")
}
