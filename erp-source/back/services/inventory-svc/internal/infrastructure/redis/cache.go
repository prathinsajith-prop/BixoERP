package redis

import (
	"context"
	"time"

	"github.com/erp/inventory-svc/internal/application/port"
	goredis "github.com/redis/go-redis/v9"
)

type cacheAdapter struct {
	client *goredis.Client
}

func NewCacheAdapter(client *goredis.Client) port.CachePort {
	return &cacheAdapter{client: client}
}

func (c *cacheAdapter) Get(ctx context.Context, key string) ([]byte, error) {
	val, err := c.client.Get(ctx, key).Bytes()
	if err == goredis.Nil {
		return nil, nil
	}
	return val, err
}

func (c *cacheAdapter) Set(ctx context.Context, key string, value []byte, ttl time.Duration) error {
	return c.client.Set(ctx, key, value, ttl).Err()
}

func (c *cacheAdapter) Delete(ctx context.Context, key string) error {
	return c.client.Del(ctx, key).Err()
}

func (c *cacheAdapter) DeleteByPrefix(ctx context.Context, prefix string) error {
	iter := c.client.Scan(ctx, 0, prefix+"*", 100).Iterator()
	for iter.Next(ctx) {
		if err := c.client.Del(ctx, iter.Val()).Err(); err != nil {
			return err
		}
	}
	return iter.Err()
}
