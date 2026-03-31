package config

import (
	"fmt"
	"os"
)

type Config struct {
	Port     string
	GRPCPort string

	ElasticsearchURL      string
	ElasticsearchUsername string
	ElasticsearchPassword string

	KafkaBrokers  string
	KafkaGroupID  string
	KafkaClientID string

	JWTSecret string
	LogLevel  string

	S3Bucket   string
	S3Region   string
	S3Endpoint string
}

func Load() (*Config, error) {
	cfg := &Config{
		Port:     getEnv("PORT", "3014"),
		GRPCPort: getEnv("GRPC_PORT", "50064"),

		ElasticsearchURL:      getEnv("ELASTICSEARCH_URL", "http://localhost:9200"),
		ElasticsearchUsername: getEnv("ELASTICSEARCH_USERNAME", ""),
		ElasticsearchPassword: getEnv("ELASTICSEARCH_PASSWORD", ""),

		KafkaBrokers:  getEnv("KAFKA_BROKERS", "localhost:9092"),
		KafkaGroupID:  getEnv("KAFKA_GROUP_ID", "audit-svc"),
		KafkaClientID: getEnv("KAFKA_CLIENT_ID", "audit-svc"),

		JWTSecret: getEnv("JWT_SECRET", ""),
		LogLevel:  getEnv("LOG_LEVEL", "info"),

		S3Bucket:   getEnv("S3_BUCKET", "audit-archive"),
		S3Region:   getEnv("S3_REGION", "us-east-1"),
		S3Endpoint: getEnv("S3_ENDPOINT", ""),
	}

	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
