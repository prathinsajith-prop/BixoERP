package config

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	Port     string
	GRPCPort string

	DBHost     string
	DBPort     int
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string
	DBMaxConns int

	RedisHost     string
	RedisPort     int
	RedisPassword string
	RedisDB       int

	KafkaBrokers  string
	KafkaGroupID  string
	KafkaClientID string

	JWTSecret string
	LogLevel  string
}

func Load() (*Config, error) {
	dbPort, _ := strconv.Atoi(getEnv("DB_PORT", "5432"))
	dbMaxConns, _ := strconv.Atoi(getEnv("DB_MAX_CONNS", "20"))
	redisPort, _ := strconv.Atoi(getEnv("REDIS_PORT", "6379"))
	redisDB, _ := strconv.Atoi(getEnv("REDIS_DB", "0"))

	cfg := &Config{
		Port:     getEnv("PORT", "3005"),
		GRPCPort: getEnv("GRPC_PORT", "50055"),

		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     dbPort,
		DBUser:     getEnv("DB_USER", "inventory_user"),
		DBPassword: getEnv("DB_PASSWORD", "inventory_pass"),
		DBName:     getEnv("DB_NAME", "inventory_db"),
		DBSSLMode:  getEnv("DB_SSL_MODE", "disable"),
		DBMaxConns: dbMaxConns,

		RedisHost:     getEnv("REDIS_HOST", "localhost"),
		RedisPort:     redisPort,
		RedisPassword: getEnv("REDIS_PASSWORD", ""),
		RedisDB:       redisDB,

		KafkaBrokers:  getEnv("KAFKA_BROKERS", "localhost:9092"),
		KafkaGroupID:  getEnv("KAFKA_GROUP_ID", "inventory-svc"),
		KafkaClientID: getEnv("KAFKA_CLIENT_ID", "inventory-svc"),

		JWTSecret: getEnv("JWT_SECRET", ""),
		LogLevel:  getEnv("LOG_LEVEL", "info"),
	}

	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	return cfg, nil
}

func (c *Config) DatabaseURL() string {
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?sslmode=%s",
		c.DBUser, c.DBPassword, c.DBHost, c.DBPort, c.DBName, c.DBSSLMode,
	)
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
