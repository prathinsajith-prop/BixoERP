package port

import (
	"context"
	"time"
)

// CachePort defines the interface for caching operations.
type CachePort interface {
	Get(ctx context.Context, key string) (string, error)
	Set(ctx context.Context, key string, value string, ttl time.Duration) error
	Delete(ctx context.Context, key string) error
}
