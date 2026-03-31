export default () => ({
  port: parseInt(process.env.PORT || '3010', 10),
  serviceName: 'notification-svc',

  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://erp:erp_dev_password@localhost:27017/notification_db?authSource=admin',
  },

  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: 'notification-svc',
    groupId: 'notification-svc-group',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    keyPrefix: 'notif:',
    ttl: parseInt(process.env.REDIS_TTL || '3600', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    issuer: process.env.JWT_ISSUER || 'erp-core',
  },

  grpc: {
    port: parseInt(process.env.GRPC_PORT || '50060', 10),
  },

  otlp: {
    endpoint: process.env.OTLP_ENDPOINT || 'http://localhost:4318',
  },

  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173,http://localhost:5174').split(','),
  },

  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@erp.local',
  },

  whatsapp: {
    apiUrl: process.env.WHATSAPP_API_URL || '',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  },
});
