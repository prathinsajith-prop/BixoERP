import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { ScheduleModule } from '@nestjs/schedule';

// Config
import configuration from './infrastructure/config/configuration';

// ORM Entities
import {
  WorkflowDefinitionOrmEntity,
  ApprovalRequestOrmEntity,
  ApprovalStepOrmEntity,
  DelegationRuleOrmEntity,
  OutboxEventOrmEntity,
  ProcessedEventOrmEntity,
} from './infrastructure/database/entities';

// Domain repository tokens
import { WORKFLOW_DEFINITION_REPOSITORY } from './domain/repositories/workflow-definition.repository';
import { APPROVAL_REQUEST_REPOSITORY } from './domain/repositories/approval-request.repository';

// Infrastructure implementations
import { PostgresWorkflowDefinitionRepository } from './infrastructure/database/repositories/postgres-workflow-definition.repository';
import { PostgresApprovalRequestRepository } from './infrastructure/database/repositories/postgres-approval-request.repository';
import { PostgresDelegationRuleRepository } from './infrastructure/database/repositories/postgres-delegation-rule.repository';
import { KafkaEventPublisher } from './infrastructure/kafka/producers/kafka-event-publisher';
import { KafkaEventConsumer } from './infrastructure/kafka/consumers/kafka-event-consumer';
import { RedisCache } from './infrastructure/cache/redis-cache';
import { OutboxRelay } from './infrastructure/outbox/outbox-relay';
import { EscalationScheduler } from './infrastructure/scheduler/escalation-scheduler';

// Application ports
import { EVENT_PUBLISHER } from './application/ports/event-publisher.port';
import { CACHE_PORT } from './application/ports/cache.port';

// Domain services
import { ApprovalEngine } from './domain/services/approval-engine.service';

// Use cases
import { CreateWorkflowDefinitionUseCase } from './application/use-cases/create-workflow-definition.use-case';
import { SubmitApprovalRequestUseCase } from './application/use-cases/submit-approval-request.use-case';
import { ProcessApprovalStepUseCase } from './application/use-cases/process-approval-step.use-case';
import { EscalateRequestUseCase } from './application/use-cases/escalate-request.use-case';

// Controllers
import { WorkflowDefinitionController } from './api/controllers/workflow-definition.controller';
import { ApprovalRequestController } from './api/controllers/approval-request.controller';
import { DelegationRuleController } from './api/controllers/delegation-rule.controller';
import { HealthController } from './infrastructure/health/health.controller';

// Middleware
import { JwtMiddleware } from './api/middleware/jwt.middleware';

const ormEntities = [
  WorkflowDefinitionOrmEntity,
  ApprovalRequestOrmEntity,
  ApprovalStepOrmEntity,
  DelegationRuleOrmEntity,
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
    WorkflowDefinitionController,
    ApprovalRequestController,
    DelegationRuleController,
    HealthController,
  ],
  providers: [
    // Infrastructure → Domain port bindings
    { provide: WORKFLOW_DEFINITION_REPOSITORY, useClass: PostgresWorkflowDefinitionRepository },
    { provide: APPROVAL_REQUEST_REPOSITORY, useClass: PostgresApprovalRequestRepository },
    { provide: EVENT_PUBLISHER, useClass: KafkaEventPublisher },
    { provide: CACHE_PORT, useClass: RedisCache },

    // Infrastructure services
    PostgresDelegationRuleRepository,
    KafkaEventPublisher,
    KafkaEventConsumer,
    OutboxRelay,
    EscalationScheduler,

    // Domain services
    ApprovalEngine,

    // Use cases
    CreateWorkflowDefinitionUseCase,
    SubmitApprovalRequestUseCase,
    ProcessApprovalStepUseCase,
    EscalateRequestUseCase,
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
