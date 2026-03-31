package port

import "context"

// EventPublisher abstraction for publishing domain events.
type EventPublisher interface {
	Publish(ctx context.Context, topic string, key string, payload []byte) error
	Close() error
}
