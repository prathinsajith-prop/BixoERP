package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/erp/audit-svc/internal/api/handler"
	"github.com/erp/audit-svc/internal/api/middleware"
	"github.com/erp/audit-svc/internal/api/router"
	"github.com/erp/audit-svc/internal/application/usecase"
	"github.com/erp/audit-svc/internal/domain/service"
	"github.com/erp/audit-svc/internal/infrastructure/config"
	infraes "github.com/erp/audit-svc/internal/infrastructure/elasticsearch"
	"github.com/erp/audit-svc/internal/infrastructure/kafka"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	fiberlogger "github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/fiber/v2/middleware/requestid"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	// Elasticsearch
	esClient, err := infraes.NewClient(cfg)
	if err != nil {
		log.Fatalf("failed to connect to elasticsearch: %v", err)
	}

	// Repository
	auditRepo := infraes.NewAuditRepository(esClient)

	// Domain services
	integritySvc := service.NewIntegrityService(auditRepo)

	// Use cases
	recordAudit := usecase.NewRecordAuditUseCase(auditRepo)
	searchAudit := usecase.NewSearchAuditUseCase(auditRepo)
	verifyIntegrity := usecase.NewVerifyIntegrityUseCase(integritySvc)

	// Handlers
	auditHandler := handler.NewAuditHandler(searchAudit, verifyIntegrity)
	healthHandler := handler.NewHealthHandler(esClient)

	// Fiber app
	app := fiber.New(fiber.Config{
		AppName:      "audit-svc",
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  30 * time.Second,
	})

	app.Use(recover.New())
	app.Use(requestid.New())
	app.Use(fiberlogger.New(fiberlogger.Config{
		Format: "${time} | ${status} | ${latency} | ${method} | ${path}\n",
	}))
	app.Use(cors.New())

	// JWT & tenant middleware
	jwtMw := middleware.NewJWTMiddleware(cfg.JWTSecret)
	tenantMw := middleware.NewTenantMiddleware()

	// Routes
	router.Setup(app, auditHandler, healthHandler, jwtMw, tenantMw)

	// Kafka consumer — subscribes to ALL topics
	consumer := kafka.NewConsumer(cfg, recordAudit)
	ctx, cancel := context.WithCancel(context.Background())
	go consumer.Start(ctx)

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		if err := app.Listen(":" + cfg.Port); err != nil {
			log.Fatalf("server error: %v", err)
		}
	}()

	log.Printf("audit-svc started on port %s", cfg.Port)

	<-quit
	log.Println("shutting down...")

	cancel()

	if err := consumer.Close(); err != nil {
		log.Printf("kafka consumer close error: %v", err)
	}

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	_ = shutdownCtx // used for any cleanup that needs a deadline
	if err := app.Shutdown(); err != nil {
		log.Printf("server shutdown error: %v", err)
	}

	log.Println("audit-svc stopped")
}
