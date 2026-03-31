package redis

import (
	"context"
	"fmt"

	"github.com/erp/inventory-svc/internal/infrastructure/config"
	goredis "github.com/redis/go-redis/v9"
)

func NewClient(cfg *config.Config) (*goredis.Client, error) {
	client := goredis.NewClient(&goredis.Options{
		Addr:     fmt.Sprintf("%s:%d", cfg.RedisHost, cfg.RedisPort),
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
	})

	if err := client.Ping(context.Background()).Err(); err != nil {
		return nil, fmt.Errorf("redis ping: %w", err)
	}

	return client, nil
}
