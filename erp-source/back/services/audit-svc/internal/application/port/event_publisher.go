package port

import "context"

// EventPublisher defines the interface for publishing domain events.
type EventPublisher interface {
	Publish(ctx context.Context, topic string, key string, value []byte) error
	Close() error
}
