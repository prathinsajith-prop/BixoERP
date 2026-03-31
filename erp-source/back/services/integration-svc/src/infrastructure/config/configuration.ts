export default () => ({
  port: parseInt(process.env.PORT || '3012', 10),
  serviceName: 'integration-svc',

  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://erp:erp_dev_password@localhost:27017/integration_db',
  },

  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: 'integration-svc',
    groupId: 'integration-svc-group',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    keyPrefix: 'integration:',
    ttl: parseInt(process.env.REDIS_TTL || '3600', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    issuer: process.env.JWT_ISSUER || 'erp-gateway',
  },

  grpc: {
    port: parseInt(process.env.GRPC_PORT || '50062', 10),
  },

  otlp: {
    endpoint: process.env.OTLP_ENDPOINT || 'http://localhost:4318',
  },

  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  },

  webhook: {
    maxRetries: parseInt(process.env.WEBHOOK_MAX_RETRIES || '5', 10),
    initialDelayMs: parseInt(process.env.WEBHOOK_INITIAL_DELAY_MS || '1000', 10),
  },
});
