package kafka

import (
	"context"
	"log"
	"strings"
	"time"

	"github.com/erp/inventory-svc/internal/infrastructure/config"
	kafkago "github.com/segmentio/kafka-go"
)

type Publisher struct {
	writers map[string]*kafkago.Writer
	brokers []string
}

func NewPublisher(cfg *config.Config) *Publisher {
	return &Publisher{
		writers: make(map[string]*kafkago.Writer),
		brokers: strings.Split(cfg.KafkaBrokers, ","),
	}
}

func (p *Publisher) getWriter(topic string) *kafkago.Writer {
	if w, ok := p.writers[topic]; ok {
		return w
	}

	w := &kafkago.Writer{
		Addr:         kafkago.TCP(p.brokers...),
		Topic:        topic,
		Balancer:     &kafkago.LeastBytes{},
		BatchTimeout: 10 * time.Millisecond,
		RequiredAcks: kafkago.RequireAll,
		MaxAttempts:  3,
	}

	p.writers[topic] = w
	return w
}

func (p *Publisher) Publish(ctx context.Context, topic string, key string, payload []byte) error {
	writer := p.getWriter(topic)

	msg := kafkago.Message{
		Key:   []byte(key),
		Value: payload,
		Time:  time.Now().UTC(),
	}

	if err := writer.WriteMessages(ctx, msg); err != nil {
		log.Printf("kafka publish error [%s]: %v", topic, err)
		return err
	}

	return nil
}

func (p *Publisher) Close() error {
	for topic, w := range p.writers {
		if err := w.Close(); err != nil {
			log.Printf("failed to close kafka writer for %s: %v", topic, err)
		}
	}
	return nil
}
