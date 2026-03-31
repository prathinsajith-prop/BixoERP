package postgres

import (
	"context"
	"fmt"

	"github.com/erp/inventory-svc/internal/infrastructure/config"
	"github.com/jackc/pgx/v5/pgxpool"
)

func NewPool(cfg *config.Config) (*pgxpool.Pool, error) {
	poolCfg, err := pgxpool.ParseConfig(cfg.DatabaseURL())
	if err != nil {
		return nil, fmt.Errorf("parse db config: %w", err)
	}

	poolCfg.MaxConns = int32(cfg.DBMaxConns)

	pool, err := pgxpool.NewWithConfig(context.Background(), poolCfg)
	if err != nil {
		return nil, fmt.Errorf("create pool: %w", err)
	}

	if err := pool.Ping(context.Background()); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping db: %w", err)
	}

	return pool, nil
}
