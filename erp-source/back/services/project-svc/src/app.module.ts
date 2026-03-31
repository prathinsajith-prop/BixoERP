import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { ScheduleModule } from '@nestjs/schedule';

// Config
import configuration from './infrastructure/config/configuration';

// ORM Entities
import {
  ProjectOrmEntity,
  TaskOrmEntity,
  MilestoneOrmEntity,
  TimesheetEntryOrmEntity,
  ProjectBudgetOrmEntity,
  OutboxEventOrmEntity,
  ProcessedEventOrmEntity,
} from './infrastructure/database/entities';

// Domain repository tokens
import { PROJECT_REPOSITORY } from './domain/repositories/project.repository';
import { TASK_REPOSITORY } from './domain/repositories/task.repository';

// Infrastructure implementations
import { PostgresProjectRepository } from './infrastructure/database/repositories/postgres-project.repository';
import { PostgresTaskRepository } from './infrastructure/database/repositories/postgres-task.repository';
import { KafkaEventPublisher } from './infrastructure/kafka/producers/kafka-event-publisher';
import { KafkaEventConsumer } from './infrastructure/kafka/consumers/kafka-event-consumer';
import { RedisCache } from './infrastructure/cache/redis-cache';
import { OutboxRelay } from './infrastructure/outbox/outbox-relay';

// Application ports
import { EVENT_PUBLISHER } from './application/ports/event-publisher.port';
import { CACHE_PORT } from './application/ports/cache.port';

// Use cases
import { CreateProjectUseCase } from './application/use-cases/create-project.use-case';
import { UpdateProjectStatusUseCase } from './application/use-cases/update-project-status.use-case';
import { LogTimesheetUseCase } from './application/use-cases/log-timesheet.use-case';
import { TrackBudgetVarianceUseCase } from './application/use-cases/track-budget-variance.use-case';

// Controllers
import { ProjectController } from './api/controllers/project.controller';
import { TaskController } from './api/controllers/task.controller';
import { TimesheetController } from './api/controllers/timesheet.controller';
import { HealthController } from './infrastructure/health/health.controller';

// Middleware
import { JwtMiddleware } from './api/middleware/jwt.middleware';

const ormEntities = [
  ProjectOrmEntity,
  TaskOrmEntity,
  MilestoneOrmEntity,
  TimesheetEntryOrmEntity,
  ProjectBudgetOrmEntity,
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
        synchronize: false, // use migrations in production
        logging: config.get<boolean>('database.logging'),
      }),
    }),
    TypeOrmModule.forFeature(ormEntities),
    TerminusModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [
    ProjectController,
    TaskController,
    TimesheetController,
    HealthController,
  ],
  providers: [
    // Infrastructure → Domain port bindings
    { provide: PROJECT_REPOSITORY, useClass: PostgresProjectRepository },
    { provide: TASK_REPOSITORY, useClass: PostgresTaskRepository },
    { provide: EVENT_PUBLISHER, useClass: KafkaEventPublisher },
    { provide: CACHE_PORT, useClass: RedisCache },

    // Infrastructure services
    KafkaEventPublisher,
    KafkaEventConsumer,
    RedisCache,
    OutboxRelay,

    // Use cases
    CreateProjectUseCase,
    UpdateProjectStatusUseCase,
    LogTimesheetUseCase,
    TrackBudgetVarianceUseCase,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(JwtMiddleware).forRoutes('api/*');
  }
}
