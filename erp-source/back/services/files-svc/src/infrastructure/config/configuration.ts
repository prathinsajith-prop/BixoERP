export default () => ({
  port: parseInt(process.env.PORT || '3011', 10),
  serviceName: 'files-svc',

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'erp',
    password: process.env.DB_PASSWORD || 'erp_dev_password',
    database: process.env.DB_NAME || 'files_db',
    schema: process.env.DB_SCHEMA || 'public',
    logging: process.env.DB_LOGGING === 'true',
  },

  storage: {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9001',
    region: process.env.S3_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET || 'erp-files',
    accessKeyId: process.env.S3_ACCESS_KEY || 'erp_minio',
    secretAccessKey: process.env.S3_SECRET_KEY || 'erp_minio_password',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10),
  },

  virusScan: {
    enabled: process.env.VIRUS_SCAN_ENABLED === 'true',
  },

  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: 'files-svc',
    groupId: 'files-svc-group',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    keyPrefix: 'files:',
    ttl: parseInt(process.env.REDIS_TTL || '3600', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    issuer: process.env.JWT_ISSUER || 'erp-core',
  },

  grpc: {
    port: parseInt(process.env.GRPC_PORT || '50061', 10),
  },

  observability: {
    otlpEndpoint: process.env.OTLP_ENDPOINT || 'http://localhost:4318',
    metricsPath: '/metrics',
  },
});
