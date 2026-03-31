import { Module, MiddlewareConsumer, NestModule, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TerminusModule } from '@nestjs/terminus';

// Config
import configuration from './infrastructure/config/configuration';

// Mongoose schemas
import { WebhookSubscriptionModel, WebhookSubscriptionSchema } from './infrastructure/database/schemas/webhook-subscription.schema';
import { IntegrationLogModel, IntegrationLogSchema } from './infrastructure/database/schemas/integration-log.schema';
import { ExternalAdapterModel, ExternalAdapterSchema } from './infrastructure/database/schemas/external-adapter.schema';
import { ProcessedEventModel, ProcessedEventSchema } from './infrastructure/database/schemas/processed-event.schema';

// Domain repository tokens
import { WEBHOOK_SUBSCRIPTION_REPOSITORY } from './domain/repositories/webhook-subscription.repository';
import { INTEGRATION_LOG_REPOSITORY } from './domain/repositories/integration-log.repository';

// Infrastructure implementations
import { MongoWebhookSubscriptionRepository } from './infrastructure/database/repositories/mongo-webhook-subscription.repository';
import { MongoIntegrationLogRepository } from './infrastructure/database/repositories/mongo-integration-log.repository';
import { KafkaEventPublisher } from './infrastructure/kafka/kafka-event-publisher';
import { KafkaEventConsumer } from './infrastructure/kafka/kafka-event-consumer';
import { RedisCache } from './infrastructure/cache/redis-cache';
import { AxiosHttpClient } from './infrastructure/http/axios-http-client';

// Kafka event handlers
import { InvoicePaidHandler } from './infrastructure/kafka/handlers/invoice-paid.handler';
import { SalesOrderCreatedHandler } from './infrastructure/kafka/handlers/sales-order-created.handler';
import { InventoryUpdatedHandler } from './infrastructure/kafka/handlers/inventory-updated.handler';
import { WorkflowCompletedHandler } from './infrastructure/kafka/handlers/workflow-completed.handler';
import { EmployeeCreatedHandler } from './infrastructure/kafka/handlers/employee-created.handler';
import { PaymentProcessedHandler } from './infrastructure/kafka/handlers/payment-processed.handler';

// Application ports
import { EVENT_PUBLISHER } from './application/ports/event-publisher.port';
import { CACHE_PORT } from './application/ports/cache.port';
import { HTTP_CLIENT } from './application/ports/http-client.port';

// Use cases
import { RegisterWebhookUseCase } from './application/use-cases/register-webhook.use-case';
import { DeliverWebhookUseCase } from './application/use-cases/deliver-webhook.use-case';
import { RetryFailedDeliveryUseCase } from './application/use-cases/retry-failed-delivery.use-case';

// Controllers
import { WebhookSubscriptionController } from './api/controllers/webhook-subscription.controller';
import { IntegrationLogController } from './api/controllers/integration-log.controller';
import { HealthController } from './infrastructure/health/health.controller';

// Middleware
import { JwtMiddleware } from './api/middleware/jwt.middleware';

const mongooseSchemas = [
  { name: WebhookSubscriptionModel.name, schema: WebhookSubscriptionSchema },
  { name: IntegrationLogModel.name, schema: IntegrationLogSchema },
  { name: ExternalAdapterModel.name, schema: ExternalAdapterSchema },
  { name: ProcessedEventModel.name, schema: ProcessedEventSchema },
];

const eventHandlers = [
  InvoicePaidHandler,
  SalesOrderCreatedHandler,
  InventoryUpdatedHandler,
  WorkflowCompletedHandler,
  EmployeeCreatedHandler,
  PaymentProcessedHandler,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('mongo.uri'),
      }),
    }),
    MongooseModule.forFeature(mongooseSchemas),
    TerminusModule,
  ],
  controllers: [
    WebhookSubscriptionController,
    IntegrationLogController,
    HealthController,
  ],
  providers: [
    // Infrastructure → Domain port bindings
    { provide: WEBHOOK_SUBSCRIPTION_REPOSITORY, useClass: MongoWebhookSubscriptionRepository },
    { provide: INTEGRATION_LOG_REPOSITORY, useClass: MongoIntegrationLogRepository },
    { provide: EVENT_PUBLISHER, useClass: KafkaEventPublisher },
    { provide: CACHE_PORT, useClass: RedisCache },
    { provide: HTTP_CLIENT, useClass: AxiosHttpClient },

    // Infrastructure services
    KafkaEventPublisher,
    KafkaEventConsumer,
    RedisCache,
    AxiosHttpClient,

    // Event handlers
    ...eventHandlers,

    // Use cases
    RegisterWebhookUseCase,
    DeliverWebhookUseCase,
    RetryFailedDeliveryUseCase,
  ],
})
export class AppModule implements NestModule, OnModuleInit {
  constructor(
    private readonly kafkaConsumer: KafkaEventConsumer,
    private readonly invoicePaidHandler: InvoicePaidHandler,
    private readonly salesOrderCreatedHandler: SalesOrderCreatedHandler,
    private readonly inventoryUpdatedHandler: InventoryUpdatedHandler,
    private readonly workflowCompletedHandler: WorkflowCompletedHandler,
    private readonly employeeCreatedHandler: EmployeeCreatedHandler,
    private readonly paymentProcessedHandler: PaymentProcessedHandler,
  ) {}

  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(JwtMiddleware).forRoutes('api/*');
  }

  onModuleInit(): void {
    // Register all Kafka event handlers
    this.kafkaConsumer.registerHandler(this.invoicePaidHandler);
    this.kafkaConsumer.registerHandler(this.salesOrderCreatedHandler);
    this.kafkaConsumer.registerHandler(this.inventoryUpdatedHandler);
    this.kafkaConsumer.registerHandler(this.workflowCompletedHandler);
    this.kafkaConsumer.registerHandler(this.employeeCreatedHandler);
    this.kafkaConsumer.registerHandler(this.paymentProcessedHandler);
  }
}
