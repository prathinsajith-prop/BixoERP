package kafka

import (
	"context"
	"encoding/json"
	"log"
	"strings"
	"time"

	"github.com/erp/audit-svc/internal/application/usecase"
	"github.com/erp/audit-svc/internal/infrastructure/config"
	kafkago "github.com/segmentio/kafka-go"
)

// Consumer subscribes to ALL Kafka topics (*.* pattern) to capture every event
// across the entire ERP system for audit logging.
type Consumer struct {
	cfg      *config.Config
	recorder *usecase.RecordAuditUseCase
	readers  []*kafkago.Reader
}

func NewConsumer(cfg *config.Config, recorder *usecase.RecordAuditUseCase) *Consumer {
	return &Consumer{
		cfg:      cfg,
		recorder: recorder,
	}
}

// allTopics lists all known ERP event topics.
// In production, this would use Kafka admin API for topic discovery.
var allTopics = []string{
	// Finance
	"finance.invoice.created",
	"finance.invoice.paid",
	"finance.invoice.cancelled",
	"finance.payment.processed",
	"finance.journal.posted",
	// AP/AR
	"apar.vendor-invoice.created",
	"apar.vendor-invoice.approved",
	"apar.payment-run.executed",
	"apar.payment-run.completed",
	// HR
	"hr.employee.created",
	"hr.employee.updated",
	"hr.employee.terminated",
	"hr.payroll.processed",
	"hr.leave.requested",
	"hr.leave.approved",
	// Sales
	"sales.order.created",
	"sales.order.confirmed",
	"sales.order.shipped",
	"sales.order.cancelled",
	"sales.quotation.created",
	// Inventory
	"inventory.stock.received",
	"inventory.stock.issued",
	"inventory.stock.transferred",
	"inventory.stock.adjusted",
	"inventory.reorder.triggered",
	// Procurement
	"procurement.purchase-order.created",
	"procurement.purchase-order.approved",
	"procurement.purchase-order.received",
	// Project
	"project.project.created",
	"project.task.completed",
	"project.milestone.reached",
	"project.timesheet.submitted",
	// Workflow
	"workflow.request.created",
	"workflow.request.approved",
	"workflow.request.rejected",
	"workflow.step.completed",
	// Integration
	"integration.webhook.received",
	"integration.webhook.delivered",
	// Notification
	"notification.sent",
	"notification.failed",
	// Files
	"files.file.uploaded",
	"files.file.deleted",
	// Manufacturing
	"manufacturing.order.created",
	"manufacturing.order.completed",
	// Report
	"report.generated",
}

// Start begins consuming messages from all topics.
func (c *Consumer) Start(ctx context.Context) {
	brokers := strings.Split(c.cfg.KafkaBrokers, ",")

	reader := kafkago.NewReader(kafkago.ReaderConfig{
		Brokers:        brokers,
		GroupID:        c.cfg.KafkaGroupID,
		GroupTopics:    allTopics,
		MinBytes:       1e3,  // 1KB
		MaxBytes:       10e6, // 10MB
		MaxWait:        3 * time.Second,
		CommitInterval: time.Second,
		StartOffset:    kafkago.FirstOffset,
	})
	c.readers = append(c.readers, reader)

	log.Printf("audit-svc kafka consumer started, subscribing to %d topics", len(allTopics))

	for {
		msg, err := reader.ReadMessage(ctx)
		if err != nil {
			if ctx.Err() != nil {
				log.Println("kafka consumer shutting down")
				return
			}
			log.Printf("kafka read error: %v", err)
			time.Sleep(time.Second)
			continue
		}

		c.handleMessage(ctx, msg)
	}
}

// handleMessage processes a single Kafka message and records it as an audit entry.
func (c *Consumer) handleMessage(ctx context.Context, msg kafkago.Message) {
	var payload map[string]interface{}
	if err := json.Unmarshal(msg.Value, &payload); err != nil {
		log.Printf("failed to unmarshal kafka message from topic %s: %v", msg.Topic, err)
		return
	}

	// Extract fields from the event payload
	eventID := extractString(payload, "event_id", "id")
	aggregateID := extractString(payload, "aggregate_id", "entity_id", "id")
	aggregateType := extractString(payload, "aggregate_type", "entity_type")
	tenantID := extractString(payload, "tenant_id")
	userID := extractString(payload, "user_id", "actor_id")
	action := extractString(payload, "action", "event_type")
	source := extractTopicSource(msg.Topic)

	// If no explicit action, derive from topic
	if action == "" {
		action = msg.Topic
	}
	if aggregateType == "" {
		aggregateType = deriveAggregateType(msg.Topic)
	}

	// Extract before/after snapshots if present
	before := extractMap(payload, "before", "old_state", "previous")
	after := extractMap(payload, "after", "new_state", "current", "data")

	// Build metadata from remaining fields
	metadata := map[string]interface{}{
		"kafka_topic":     msg.Topic,
		"kafka_partition": msg.Partition,
		"kafka_offset":    msg.Offset,
	}
	if ts, ok := payload["timestamp"]; ok {
		metadata["event_timestamp"] = ts
	}
	if correlationID, ok := payload["correlation_id"]; ok {
		metadata["correlation_id"] = correlationID
	}

	input := usecase.RecordInput{
		EventID:       eventID,
		EventType:     msg.Topic,
		AggregateID:   aggregateID,
		AggregateType: aggregateType,
		TenantID:      tenantID,
		UserID:        userID,
		Action:        action,
		Source:        source,
		Before:        before,
		After:         after,
		Metadata:      metadata,
	}

	if _, err := c.recorder.Execute(ctx, input); err != nil {
		log.Printf("failed to record audit entry for topic %s: %v", msg.Topic, err)
	}
}

// extractString extracts the first non-empty string value from payload using candidate keys.
func extractString(payload map[string]interface{}, keys ...string) string {
	for _, key := range keys {
		if v, ok := payload[key]; ok {
			if s, ok := v.(string); ok && s != "" {
				return s
			}
		}
	}
	return ""
}

// extractMap extracts the first non-nil map from payload using candidate keys.
func extractMap(payload map[string]interface{}, keys ...string) map[string]interface{} {
	for _, key := range keys {
		if v, ok := payload[key]; ok {
			if m, ok := v.(map[string]interface{}); ok {
				return m
			}
		}
	}
	return nil
}

// extractTopicSource returns the service name from a topic like "finance.invoice.created" -> "finance".
func extractTopicSource(topic string) string {
	parts := strings.SplitN(topic, ".", 2)
	if len(parts) > 0 {
		return parts[0]
	}
	return topic
}

// deriveAggregateType derives aggregate type from topic, e.g. "finance.invoice.created" -> "invoice".
func deriveAggregateType(topic string) string {
	parts := strings.Split(topic, ".")
	if len(parts) >= 2 {
		return parts[1]
	}
	return "unknown"
}

// Close stops all Kafka readers.
func (c *Consumer) Close() error {
	var lastErr error
	for _, reader := range c.readers {
		if err := reader.Close(); err != nil {
			lastErr = err
		}
	}
	return lastErr
}
