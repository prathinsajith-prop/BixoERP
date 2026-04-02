import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { ScheduleModule } from '@nestjs/schedule';

// Config
import configuration from './infrastructure/config/configuration';

// ORM Entities
import {
  AccountOrmEntity,
  JournalEntryOrmEntity,
  JournalLineOrmEntity,
  InvoiceOrmEntity,
  InvoiceLineOrmEntity,
  OutboxEventOrmEntity,
  ProcessedEventOrmEntity,
} from './infrastructure/database/entities';
import { FiscalPeriodOrmEntity } from './infrastructure/database/entities/fiscal-period.orm-entity';
import { BudgetOrmEntity } from './infrastructure/database/entities/budget.orm-entity';
import { BudgetLineOrmEntity } from './infrastructure/database/entities/budget-line.orm-entity';

// Domain repository tokens
import { ACCOUNT_REPOSITORY } from './domain/repositories/account.repository';
import { JOURNAL_ENTRY_REPOSITORY } from './domain/repositories/journal-entry.repository';
import { INVOICE_REPOSITORY } from './domain/repositories/invoice.repository';
import { FISCAL_PERIOD_REPOSITORY } from './domain/repositories/fiscal-period.repository';
import { BUDGET_REPOSITORY } from './domain/repositories/budget.repository';

// Infrastructure implementations
import { PostgresAccountRepository } from './infrastructure/database/repositories/postgres-account.repository';
import { PostgresJournalEntryRepository } from './infrastructure/database/repositories/postgres-journal-entry.repository';
import { PostgresInvoiceRepository } from './infrastructure/database/repositories/postgres-invoice.repository';
import { PostgresFiscalPeriodRepository } from './infrastructure/database/repositories/postgres-fiscal-period.repository';
import { PostgresBudgetRepository } from './infrastructure/database/repositories/postgres-budget.repository';
import { KafkaEventPublisher } from './infrastructure/kafka/producers/kafka-event-publisher';
import { KafkaEventConsumer } from './infrastructure/kafka/consumers/kafka-event-consumer';
import { RedisCache } from './infrastructure/cache/redis-cache';
import { OutboxRelay } from './infrastructure/outbox/outbox-relay';

// Application ports
import { EVENT_PUBLISHER } from './application/ports/event-publisher.port';
import { CACHE_PORT } from './application/ports/cache.port';

// Use cases
import { CreateJournalEntryUseCase } from './application/use-cases/create-journal-entry.use-case';
import { PostJournalEntryUseCase } from './application/use-cases/post-journal-entry.use-case';
import { PostInvoiceUseCase } from './application/use-cases/post-invoice.use-case';

// Controllers
import { JournalEntryController } from './api/controllers/journal-entry.controller';
import { AccountController } from './api/controllers/account.controller';
import { InvoiceController } from './api/controllers/invoice.controller';
import { FiscalPeriodController } from './api/controllers/fiscal-period.controller';
import { BudgetController } from './api/controllers/budget.controller';
import { HealthController } from './infrastructure/health/health.controller';

// Middleware
import { JwtMiddleware } from './api/middleware/jwt.middleware';

const ormEntities = [
  AccountOrmEntity,
  JournalEntryOrmEntity,
  JournalLineOrmEntity,
  InvoiceOrmEntity,
  InvoiceLineOrmEntity,
  OutboxEventOrmEntity,
  ProcessedEventOrmEntity,
  FiscalPeriodOrmEntity,
  BudgetOrmEntity,
  BudgetLineOrmEntity,
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
        synchronize: false, // use migrations in production
        logging: config.get<boolean>('database.logging'),
      }),
    }),
    TypeOrmModule.forFeature(ormEntities),
    TerminusModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [
    JournalEntryController,
    AccountController,
    InvoiceController,
    FiscalPeriodController,
    BudgetController,
    HealthController,
  ],
  providers: [
    // Infrastructure → Domain port bindings
    { provide: ACCOUNT_REPOSITORY, useClass: PostgresAccountRepository },
    { provide: JOURNAL_ENTRY_REPOSITORY, useClass: PostgresJournalEntryRepository },
    { provide: INVOICE_REPOSITORY, useClass: PostgresInvoiceRepository },
    { provide: FISCAL_PERIOD_REPOSITORY, useClass: PostgresFiscalPeriodRepository },
    { provide: BUDGET_REPOSITORY, useClass: PostgresBudgetRepository },
    { provide: EVENT_PUBLISHER, useClass: KafkaEventPublisher },
    { provide: CACHE_PORT, useClass: RedisCache },

    // Infrastructure services
    KafkaEventPublisher,
    KafkaEventConsumer,
    RedisCache,
    OutboxRelay,

    // Use cases
    CreateJournalEntryUseCase,
    PostJournalEntryUseCase,
    PostInvoiceUseCase,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(JwtMiddleware).forRoutes('api/*');
  }
}
