import { Module, MiddlewareConsumer, NestModule, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TerminusModule } from '@nestjs/terminus';
import { join } from 'path';

// Config
import configuration from './infrastructure/config/configuration';

// Mongoose schemas
import { NotificationModel, NotificationSchema } from './infrastructure/database/schemas/notification.schema';
import { NotificationTemplateModel, NotificationTemplateSchema } from './infrastructure/database/schemas/notification-template.schema';
import { NotificationPreferenceModel, NotificationPreferenceSchema } from './infrastructure/database/schemas/notification-preference.schema';
import { ProcessedEventModel, ProcessedEventSchema } from './infrastructure/database/schemas/processed-event.schema';

// Domain repository tokens
import { NOTIFICATION_REPOSITORY } from './domain/repositories/notification.repository';
import { TEMPLATE_REPOSITORY } from './domain/repositories/template.repository';
import { PREFERENCE_REPOSITORY } from './domain/repositories/preference.repository';

// Infrastructure implementations
import { MongoNotificationRepository } from './infrastructure/database/repositories/mongo-notification.repository';
import { MongoTemplateRepository } from './infrastructure/database/repositories/mongo-template.repository';
import { MongoPreferenceRepository } from './infrastructure/database/repositories/mongo-preference.repository';
import { KafkaEventPublisher } from './infrastructure/kafka/kafka-event-publisher';
import { KafkaEventConsumer } from './infrastructure/kafka/kafka-event-consumer';
import { RedisCache } from './infrastructure/cache/redis-cache';
import { ConsoleEmailSender } from './infrastructure/email/console-email-sender';
import { SmtpEmailSender } from './infrastructure/email/smtp-email-sender';
import { ConsolePushSender } from './infrastructure/push/console-push-sender';
import { ConsoleWhatsAppSender } from './infrastructure/whatsapp/console-whatsapp-sender';

// Kafka event handlers
import { StockBelowReorderHandler } from './infrastructure/kafka/handlers/stock-below-reorder.handler';
import { InvoicePaidHandler } from './infrastructure/kafka/handlers/invoice-paid.handler';
import { PayrollProcessedHandler } from './infrastructure/kafka/handlers/payroll-processed.handler';
import { EmployeeTerminatedHandler } from './infrastructure/kafka/handlers/employee-terminated.handler';
import { WorkflowApprovalNeededHandler } from './infrastructure/kafka/handlers/workflow-approval-needed.handler';
import { ProjectBudgetExceededHandler } from './infrastructure/kafka/handlers/project-budget-exceeded.handler';
import { TwoFactorEnabledHandler } from './infrastructure/kafka/handlers/two-factor-enabled.handler';
import { TwoFactorDisabledHandler } from './infrastructure/kafka/handlers/two-factor-disabled.handler';

// Application ports
import { EVENT_PUBLISHER } from './application/ports/event-publisher.port';
import { CACHE_PORT } from './application/ports/cache.port';
import { EMAIL_SENDER } from './application/ports/email-sender.port';
import { PUSH_SENDER } from './application/ports/push-sender.port';
import { WHATSAPP_SENDER } from './application/ports/whatsapp-sender.port';

// Use cases
import { SendNotificationUseCase } from './application/use-cases/send-notification.use-case';
import { CreateTemplateUseCase } from './application/use-cases/create-template.use-case';
import { MarkAsReadUseCase } from './application/use-cases/mark-as-read.use-case';

// Controllers
import { NotificationController } from './api/controllers/notification.controller';
import { TemplateController } from './api/controllers/template.controller';
import { NotificationSseController } from './api/sse/notification-sse.controller';
import { HealthController } from './infrastructure/health/health.controller';

// SSE Gateway
import { SseNotificationGateway } from './api/sse/notification-sse.gateway';

// Middleware
import { JwtMiddleware } from './api/middleware/jwt.middleware';

const mongooseSchemas = [
  { name: NotificationModel.name, schema: NotificationSchema },
  { name: NotificationTemplateModel.name, schema: NotificationTemplateSchema },
  { name: NotificationPreferenceModel.name, schema: NotificationPreferenceSchema },
  { name: ProcessedEventModel.name, schema: ProcessedEventSchema },
];

const eventHandlers = [
  StockBelowReorderHandler,
  InvoicePaidHandler,
  PayrollProcessedHandler,
  EmployeeTerminatedHandler,
  WorkflowApprovalNeededHandler,
  ProjectBudgetExceededHandler,
  TwoFactorEnabledHandler,
  TwoFactorDisabledHandler,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: join(__dirname, '..', '.env'),
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
    NotificationController,
    TemplateController,
    NotificationSseController,
    HealthController,
  ],
  providers: [
    // Infrastructure → Domain port bindings
    { provide: NOTIFICATION_REPOSITORY, useClass: MongoNotificationRepository },
    { provide: TEMPLATE_REPOSITORY, useClass: MongoTemplateRepository },
    { provide: PREFERENCE_REPOSITORY, useClass: MongoPreferenceRepository },
    { provide: EVENT_PUBLISHER, useClass: KafkaEventPublisher },
    { provide: CACHE_PORT, useClass: RedisCache },
    { provide: EMAIL_SENDER, useClass: SmtpEmailSender },
    { provide: PUSH_SENDER, useClass: ConsolePushSender },
    { provide: WHATSAPP_SENDER, useClass: ConsoleWhatsAppSender },

    // Infrastructure services
    KafkaEventPublisher,
    KafkaEventConsumer,
    RedisCache,
    SmtpEmailSender,
    ConsolePushSender,
    ConsoleWhatsAppSender,

    // SSE Gateway (singleton)
    SseNotificationGateway,

    // Event handlers
    ...eventHandlers,

    // Use cases
    SendNotificationUseCase,
    CreateTemplateUseCase,
    MarkAsReadUseCase,
  ],
})
export class AppModule implements NestModule, OnModuleInit {
  constructor(
    private readonly kafkaConsumer: KafkaEventConsumer,
    private readonly stockHandler: StockBelowReorderHandler,
    private readonly invoicePaidHandler: InvoicePaidHandler,
    private readonly payrollHandler: PayrollProcessedHandler,
    private readonly employeeTermHandler: EmployeeTerminatedHandler,
    private readonly approvalHandler: WorkflowApprovalNeededHandler,
    private readonly budgetHandler: ProjectBudgetExceededHandler,
    private readonly twoFactorEnabledHandler: TwoFactorEnabledHandler,
    private readonly twoFactorDisabledHandler: TwoFactorDisabledHandler,
  ) {}

  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(JwtMiddleware).forRoutes('api/*');
  }

  onModuleInit(): void {
    // Register all Kafka event handlers
    this.kafkaConsumer.registerHandler(this.stockHandler);
    this.kafkaConsumer.registerHandler(this.invoicePaidHandler);
    this.kafkaConsumer.registerHandler(this.payrollHandler);
    this.kafkaConsumer.registerHandler(this.employeeTermHandler);
    this.kafkaConsumer.registerHandler(this.approvalHandler);
    this.kafkaConsumer.registerHandler(this.budgetHandler);
    this.kafkaConsumer.registerHandler(this.twoFactorEnabledHandler);
    this.kafkaConsumer.registerHandler(this.twoFactorDisabledHandler);
  }
}
