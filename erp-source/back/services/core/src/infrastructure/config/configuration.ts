export default () => ({
  port: parseInt(process.env.PORT ?? '3015', 10),
  grpcPort: parseInt(process.env.GRPC_PORT ?? '50065', 10),

  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5436', 10),
    username: process.env.DB_USER ?? 'erp_app',
    password: process.env.DB_PASSWORD ?? 'erp_app_password',
    database: process.env.DB_NAME ?? 'auth_db',
  },

  kafka: {
    brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
    groupId: process.env.KAFKA_GROUP_ID ?? 'core',
    clientId: 'core',
  },

  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET ?? 'change-me-in-production',
    accessTokenTtl: parseInt(process.env.ACCESS_TOKEN_TTL_SECONDS ?? '900', 10), // 15 minutes
    refreshTokenTtlDays: parseInt(process.env.REFRESH_TOKEN_TTL_DAYS ?? '30', 10),
    issuer: process.env.JWT_ISSUER ?? 'erp-core',
  },

  security: {
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS ?? '5', 10),
    lockDurationMinutes: parseInt(process.env.LOCK_DURATION_MINUTES ?? '30', 10),
    passwordResetTtlMinutes: parseInt(process.env.PASSWORD_RESET_TTL_MINUTES ?? '60', 10),
  },

  social: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID ?? '',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET ?? '',
      tenantId: process.env.MICROSOFT_TENANT_ID ?? 'common',
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID ?? '',
      teamId: process.env.APPLE_TEAM_ID ?? '',
      keyId: process.env.APPLE_KEY_ID ?? '',
      privateKey: (process.env.APPLE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
    },
  },
});
