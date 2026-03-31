package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/erp/inventory-svc/internal/api/handler"
	"github.com/erp/inventory-svc/internal/api/middleware"
	"github.com/erp/inventory-svc/internal/api/router"
	"github.com/erp/inventory-svc/internal/application/usecase"
	"github.com/erp/inventory-svc/internal/domain/service"
	"github.com/erp/inventory-svc/internal/infrastructure/config"
	"github.com/erp/inventory-svc/internal/infrastructure/kafka"
	infrapostgres "github.com/erp/inventory-svc/internal/infrastructure/postgres"
	"github.com/erp/inventory-svc/internal/infrastructure/redis"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/fiber/v2/middleware/requestid"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	// Database
	dbPool, err := infrapostgres.NewPool(cfg)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer dbPool.Close()

	// Redis
	redisClient, err := redis.NewClient(cfg)
	if err != nil {
		log.Fatalf("failed to connect to redis: %v", err)
	}
	defer redisClient.Close()

	// Repositories
	stockRepo := infrapostgres.NewStockRepository(dbPool)
	movementRepo := infrapostgres.NewMovementRepository(dbPool)

	// Infrastructure ports
	cache := redis.NewCacheAdapter(redisClient)
	publisher := kafka.NewPublisher(cfg)
	defer publisher.Close()

	// Domain services
	reorderSvc := service.NewReorderService(stockRepo, publisher)

	// Use cases
	receiveStock := usecase.NewReceiveStockUseCase(stockRepo, movementRepo, publisher, cache, reorderSvc)
	issueStock := usecase.NewIssueStockUseCase(stockRepo, movementRepo, publisher, cache, reorderSvc)
	transferStock := usecase.NewTransferStockUseCase(stockRepo, movementRepo, publisher, cache, reorderSvc)
	checkReorder := usecase.NewCheckReorderLevelUseCase(stockRepo, publisher)

	// Handlers
	stockHandler := handler.NewStockHandler(stockRepo, cache)
	movementHandler := handler.NewMovementHandler(receiveStock, issueStock, transferStock)
	healthHandler := handler.NewHealthHandler(dbPool, redisClient)

	// Fiber app
	app := fiber.New(fiber.Config{
		AppName:      "inventory-svc",
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  30 * time.Second,
	})

	app.Use(recover.New())
	app.Use(requestid.New())
	app.Use(logger.New(logger.Config{
		Format: "${time} | ${status} | ${latency} | ${method} | ${path}\n",
	}))
	app.Use(cors.New())

	// JWT middleware
	jwtMw := middleware.NewJWTMiddleware(cfg.JWTSecret)
	tenantMw := middleware.NewTenantMiddleware()

	// Routes
	router.Setup(app, stockHandler, movementHandler, healthHandler, jwtMw, tenantMw)

	// Kafka consumer
	consumer := kafka.NewConsumer(cfg, stockRepo, movementRepo, publisher, cache, reorderSvc)
	go consumer.Start(context.Background())

	// Reorder checker (periodic)
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			if err := checkReorder.Execute(context.Background()); err != nil {
				log.Printf("reorder check failed: %v", err)
			}
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		if err := app.Listen(":" + cfg.Port); err != nil {
			log.Fatalf("server error: %v", err)
		}
	}()

	log.Printf("inventory-svc started on port %s", cfg.Port)

	<-quit
	log.Println("shutting down...")

	consumer.Stop()

	if err := app.ShutdownWithTimeout(10 * time.Second); err != nil {
		log.Printf("server shutdown error: %v", err)
	}

	log.Println("inventory-svc stopped")
}
