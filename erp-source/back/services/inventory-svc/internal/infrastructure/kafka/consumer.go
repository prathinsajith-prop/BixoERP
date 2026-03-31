package kafka

import (
	"context"
	"encoding/json"
	"log"
	"strings"
	"sync"

	"github.com/erp/inventory-svc/internal/application/port"
	"github.com/erp/inventory-svc/internal/domain/entity"
	"github.com/erp/inventory-svc/internal/domain/repository"
	"github.com/erp/inventory-svc/internal/domain/service"
	"github.com/erp/inventory-svc/internal/domain/valueobject"
	"github.com/erp/inventory-svc/internal/infrastructure/config"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	kafkago "github.com/segmentio/kafka-go"
	"github.com/shopspring/decimal"
)

var subscribedTopics = []string{
	"sales.order.confirmed",
	"purchase.order.received",
}

type Consumer struct {
	readers    []*kafkago.Reader
	stockRepo  repository.StockRepository
	moveRepo   repository.MovementRepository
	publisher  port.EventPublisher
	cache      port.CachePort
	reorderSvc *service.ReorderService
	wg         sync.WaitGroup
	cancel     context.CancelFunc
}

func NewConsumer(
	cfg *config.Config,
	stockRepo repository.StockRepository,
	moveRepo repository.MovementRepository,
	publisher port.EventPublisher,
	cache port.CachePort,
	reorderSvc *service.ReorderService,
) *Consumer {
	brokers := strings.Split(cfg.KafkaBrokers, ",")
	var readers []*kafkago.Reader

	for _, topic := range subscribedTopics {
		r := kafkago.NewReader(kafkago.ReaderConfig{
			Brokers:  brokers,
			Topic:    topic,
			GroupID:  cfg.KafkaGroupID,
			MinBytes: 1,
			MaxBytes: 10e6,
		})
		readers = append(readers, r)
	}

	return &Consumer{
		readers:    readers,
		stockRepo:  stockRepo,
		moveRepo:   moveRepo,
		publisher:  publisher,
		cache:      cache,
		reorderSvc: reorderSvc,
	}
}

func (c *Consumer) Start(ctx context.Context) {
	ctx, c.cancel = context.WithCancel(ctx)

	for _, reader := range c.readers {
		c.wg.Add(1)
		go c.consume(ctx, reader)
	}

	c.wg.Wait()
}

func (c *Consumer) Stop() {
	if c.cancel != nil {
		c.cancel()
	}
	for _, r := range c.readers {
		_ = r.Close()
	}
	c.wg.Wait()
}

func (c *Consumer) consume(ctx context.Context, reader *kafkago.Reader) {
	defer c.wg.Done()
	topic := reader.Config().Topic

	for {
		msg, err := reader.FetchMessage(ctx)
		if err != nil {
			if ctx.Err() != nil {
				return
			}
			log.Printf("kafka fetch error [%s]: %v", topic, err)
			continue
		}

		// Idempotency check
		eventID := string(msg.Key) + "-" + topic + "-" + string(rune(msg.Offset))
		if c.isProcessed(ctx, eventID) {
			_ = reader.CommitMessages(ctx, msg)
			continue
		}

		if err := c.handleMessage(ctx, topic, msg.Value); err != nil {
			log.Printf("kafka handle error [%s]: %v", topic, err)
			continue
		}

		c.markProcessed(ctx, eventID, topic)
		_ = reader.CommitMessages(ctx, msg)
	}
}

func (c *Consumer) handleMessage(ctx context.Context, topic string, payload []byte) error {
	switch topic {
	case "sales.order.confirmed":
		return c.handleSalesOrderConfirmed(ctx, payload)
	case "purchase.order.received":
		return c.handlePurchaseOrderReceived(ctx, payload)
	default:
		log.Printf("unhandled topic: %s", topic)
		return nil
	}
}

type salesOrderConfirmedEvent struct {
	TenantID    string `json:"tenant_id"`
	OrderID     string `json:"order_id"`
	SKU         string `json:"sku"`
	Quantity    string `json:"quantity"`
	WarehouseID string `json:"warehouse_id"`
}

func (c *Consumer) handleSalesOrderConfirmed(ctx context.Context, payload []byte) error {
	var event salesOrderConfirmedEvent
	if err := json.Unmarshal(payload, &event); err != nil {
		return err
	}

	tenantID, _ := uuid.Parse(event.TenantID)
	warehouseID, _ := uuid.Parse(event.WarehouseID)
	qty, _ := decimal.NewFromString(event.Quantity)

	item, err := c.stockRepo.GetBySKU(ctx, tenantID, event.SKU, warehouseID)
	if err != nil {
		return err
	}

	if err := item.Issue(qty); err != nil {
		return err
	}

	movement, err := entity.NewStockMovement(
		tenantID, item.ID, valueobject.MovementIssue, qty,
		&warehouseID, nil, uuid.Nil, "Auto-issued for sales order "+event.OrderID,
	)
	if err != nil {
		return err
	}

	eventPayload, _ := json.Marshal(map[string]interface{}{
		"stock_item_id": item.ID, "tenant_id": tenantID,
		"sku": item.SKU, "quantity": qty.String(),
		"warehouse_id": warehouseID, "movement_id": movement.ID,
		"trigger": "sales.order.confirmed",
	})

	outboxEvt := &repository.OutboxEvent{
		ID: uuid.New(), AggregateID: item.ID, AggregateType: "StockItem",
		EventType: "stock.issued", Payload: eventPayload, TenantID: tenantID,
	}

	err = c.stockRepo.WithTx(ctx, func(tx repository.TxContext) error {
		if err := tx.UpdateStock(ctx, item); err != nil {
			return err
		}
		if err := tx.CreateMovement(ctx, movement); err != nil {
			return err
		}
		return tx.InsertOutboxEvent(ctx, outboxEvt)
	})
	if err != nil {
		return err
	}

	_ = c.cache.Delete(ctx, "inventory:stock:"+item.ID.String())
	_ = c.reorderSvc.CheckAndEmit(ctx, item)

	return nil
}

type purchaseOrderReceivedEvent struct {
	TenantID    string `json:"tenant_id"`
	OrderID     string `json:"order_id"`
	SKU         string `json:"sku"`
	Quantity    string `json:"quantity"`
	WarehouseID string `json:"warehouse_id"`
}

func (c *Consumer) handlePurchaseOrderReceived(ctx context.Context, payload []byte) error {
	var event purchaseOrderReceivedEvent
	if err := json.Unmarshal(payload, &event); err != nil {
		return err
	}

	tenantID, _ := uuid.Parse(event.TenantID)
	warehouseID, _ := uuid.Parse(event.WarehouseID)
	qty, _ := decimal.NewFromString(event.Quantity)

	item, err := c.stockRepo.GetBySKU(ctx, tenantID, event.SKU, warehouseID)
	if err != nil {
		return err
	}

	if err := item.Receive(qty); err != nil {
		return err
	}

	movement, err := entity.NewStockMovement(
		tenantID, item.ID, valueobject.MovementReceive, qty,
		nil, &warehouseID, uuid.Nil, "Auto-received for purchase order "+event.OrderID,
	)
	if err != nil {
		return err
	}

	eventPayload, _ := json.Marshal(map[string]interface{}{
		"stock_item_id": item.ID, "tenant_id": tenantID,
		"sku": item.SKU, "quantity": qty.String(),
		"warehouse_id": warehouseID, "movement_id": movement.ID,
		"trigger": "purchase.order.received",
	})

	outboxEvt := &repository.OutboxEvent{
		ID: uuid.New(), AggregateID: item.ID, AggregateType: "StockItem",
		EventType: "stock.received", Payload: eventPayload, TenantID: tenantID,
	}

	err = c.stockRepo.WithTx(ctx, func(tx repository.TxContext) error {
		if err := tx.UpdateStock(ctx, item); err != nil {
			return err
		}
		if err := tx.CreateMovement(ctx, movement); err != nil {
			return err
		}
		return tx.InsertOutboxEvent(ctx, outboxEvt)
	})
	if err != nil {
		return err
	}

	_ = c.cache.Delete(ctx, "inventory:stock:"+item.ID.String())
	_ = c.reorderSvc.CheckAndEmit(ctx, item)

	return nil
}

// Idempotency helpers — use the StockRepository pool via type assertion
func (c *Consumer) isProcessed(ctx context.Context, eventID string) bool {
	repo, ok := c.stockRepo.(stockRepoAccessor)
	if !ok {
		return false
	}
	var exists bool
	err := repo.Pool().QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM processed_events WHERE event_id = $1)`, eventID).Scan(&exists)
	if err != nil {
		return false
	}
	return exists
}

func (c *Consumer) markProcessed(ctx context.Context, eventID, eventType string) {
	repo, ok := c.stockRepo.(stockRepoAccessor)
	if !ok {
		return
	}
	_, _ = repo.Pool().Exec(ctx, `INSERT INTO processed_events (event_id, event_type) VALUES ($1, $2) ON CONFLICT DO NOTHING`, eventID, eventType)
}

// stockRepoAccessor is a type assertion helper — the actual stock repo exposes Pool().
type stockRepoAccessor interface {
	Pool() *pgxpool.Pool
}
