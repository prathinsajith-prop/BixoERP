export default () => ({
  port: parseInt(process.env.PORT || '3004', 10),
  serviceName: 'sales-svc',

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'erp',
    password: process.env.DB_PASSWORD || 'erp_dev_password',
    database: process.env.DB_NAME || 'sales_db',
    schema: process.env.DB_SCHEMA || 'public',
    logging: process.env.DB_LOGGING === 'true',
  },

  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: 'sales-svc',
    groupId: 'sales-svc-group',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    keyPrefix: 'sales:',
    ttl: parseInt(process.env.REDIS_TTL || '3600', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    issuer: process.env.JWT_ISSUER || 'erp-gateway',
  },

  grpc: {
    port: parseInt(process.env.GRPC_PORT || '50054', 10),
  },

  elasticsearch: {
    url: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  },

  observability: {
    otlpEndpoint: process.env.OTLP_ENDPOINT || 'http://localhost:4318',
    metricsPath: '/metrics',
  },
});
