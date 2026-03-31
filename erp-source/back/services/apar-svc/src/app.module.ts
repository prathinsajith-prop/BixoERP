import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { ScheduleModule } from '@nestjs/schedule';

// Config
import configuration from './infrastructure/config/configuration';

// ORM Entities
import {
  VendorInvoiceOrmEntity,
  VendorInvoiceLineOrmEntity,
  PaymentRunOrmEntity,
  PaymentRunLineOrmEntity,
  OutboxEventOrmEntity,
  ProcessedEventOrmEntity,
} from './infrastructure/database/entities';

// Domain repository tokens
import { VENDOR_INVOICE_REPOSITORY } from './domain/repositories/vendor-invoice.repository';
import { PAYMENT_RUN_REPOSITORY } from './domain/repositories/payment-run.repository';

// Infrastructure implementations
import { PostgresVendorInvoiceRepository } from './infrastructure/database/repositories/postgres-vendor-invoice.repository';
import { PostgresPaymentRunRepository } from './infrastructure/database/repositories/postgres-payment-run.repository';
import { KafkaEventPublisher } from './infrastructure/kafka/producers/kafka-event-publisher';
import { KafkaEventConsumer } from './infrastructure/kafka/consumers/kafka-event-consumer';
import { RedisCache } from './infrastructure/cache/redis-cache';
import { OutboxRelay } from './infrastructure/outbox/outbox-relay';

// Application ports
import { EVENT_PUBLISHER } from './application/ports/event-publisher.port';
import { CACHE_PORT } from './application/ports/cache.port';

// Use cases
import { ProcessVendorInvoiceUseCase } from './application/use-cases/process-vendor-invoice.use-case';
import { ExecutePaymentRunUseCase } from './application/use-cases/execute-payment-run.use-case';
import { ThreeWayMatchUseCase } from './application/use-cases/three-way-match.use-case';

// Controllers
import { VendorInvoiceController } from './api/controllers/vendor-invoice.controller';
import { PaymentRunController } from './api/controllers/payment-run.controller';
import { HealthController } from './infrastructure/health/health.controller';

// Middleware
import { JwtMiddleware } from './api/middleware/jwt.middleware';

const ormEntities = [
  VendorInvoiceOrmEntity,
  VendorInvoiceLineOrmEntity,
  PaymentRunOrmEntity,
  PaymentRunLineOrmEntity,
  OutboxEventOrmEntity,
  ProcessedEventOrmEntity,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.database'),
        entities: ormEntities,
        synchronize: false,
        logging: config.get<boolean>('database.logging'),
      }),
    }),
    TypeOrmModule.forFeature(ormEntities),
    TerminusModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [
    VendorInvoiceController,
    PaymentRunController,
    HealthController,
  ],
  providers: [
    // Infrastructure → Domain port bindings
    { provide: VENDOR_INVOICE_REPOSITORY, useClass: PostgresVendorInvoiceRepository },
    { provide: PAYMENT_RUN_REPOSITORY, useClass: PostgresPaymentRunRepository },
    { provide: EVENT_PUBLISHER, useClass: KafkaEventPublisher },
    { provide: CACHE_PORT, useClass: RedisCache },

    // Infrastructure services
    KafkaEventPublisher,
    KafkaEventConsumer,
    RedisCache,
    OutboxRelay,

    // Use cases
    ProcessVendorInvoiceUseCase,
    ExecutePaymentRunUseCase,
    ThreeWayMatchUseCase,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(JwtMiddleware).forRoutes('api/*');
  }
}
