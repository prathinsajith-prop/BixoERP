import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { ScheduleModule } from '@nestjs/schedule';

// Config
import configuration from './infrastructure/config/configuration';

// ORM Entities
import {
  SalesOrderOrmEntity,
  SalesOrderLineOrmEntity,
  CustomerOrmEntity,
  QuotationOrmEntity,
  OutboxEventOrmEntity,
  ProcessedEventOrmEntity,
} from './infrastructure/database/entities';

// Domain repository tokens
import { SALES_ORDER_REPOSITORY } from './domain/repositories/sales-order.repository';
import { CUSTOMER_REPOSITORY } from './domain/repositories/customer.repository';

// Infrastructure implementations
import { PostgresSalesOrderRepository } from './infrastructure/database/repositories/postgres-sales-order.repository';
import { PostgresCustomerRepository } from './infrastructure/database/repositories/postgres-customer.repository';
import { KafkaEventPublisher } from './infrastructure/kafka/producers/kafka-event-publisher';
import { KafkaEventConsumer } from './infrastructure/kafka/consumers/kafka-event-consumer';
import { RedisCache } from './infrastructure/cache/redis-cache';
import { OutboxRelay } from './infrastructure/outbox/outbox-relay';
import { ElasticsearchSalesSearch } from './infrastructure/search/elasticsearch-sales-search';

// Application ports
import { EVENT_PUBLISHER } from './application/ports/event-publisher.port';
import { CACHE_PORT } from './application/ports/cache.port';
import { SEARCH_PORT } from './application/ports/search.port';

// Use cases
import { CreateSalesOrderUseCase } from './application/use-cases/create-sales-order.use-case';
import { ConfirmSalesOrderUseCase } from './application/use-cases/confirm-sales-order.use-case';
import { FulfillSalesOrderUseCase } from './application/use-cases/fulfill-sales-order.use-case';

// Controllers
import { SalesOrderController } from './api/controllers/sales-order.controller';
import { CustomerController } from './api/controllers/customer.controller';
import { HealthController } from './infrastructure/health/health.controller';

// Middleware
import { JwtMiddleware } from './api/middleware/jwt.middleware';

const ormEntities = [
  SalesOrderOrmEntity,
  SalesOrderLineOrmEntity,
  CustomerOrmEntity,
  QuotationOrmEntity,
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
    SalesOrderController,
    CustomerController,
    HealthController,
  ],
  providers: [
    // Infrastructure → Domain port bindings
    { provide: SALES_ORDER_REPOSITORY, useClass: PostgresSalesOrderRepository },
    { provide: CUSTOMER_REPOSITORY, useClass: PostgresCustomerRepository },
    { provide: EVENT_PUBLISHER, useClass: KafkaEventPublisher },
    { provide: CACHE_PORT, useClass: RedisCache },
    { provide: SEARCH_PORT, useClass: ElasticsearchSalesSearch },

    // Infrastructure services
    KafkaEventPublisher,
    KafkaEventConsumer,
    OutboxRelay,

    // Use cases
    CreateSalesOrderUseCase,
    ConfirmSalesOrderUseCase,
    FulfillSalesOrderUseCase,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(JwtMiddleware)
      .exclude('health', 'health/(.*)', 'docs', 'docs/(.*)')
      .forRoutes('*');
  }
}
