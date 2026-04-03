import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { ScheduleModule } from '@nestjs/schedule';

// Config
import configuration from './infrastructure/config/configuration';

// ORM Entities
import {
  EmployeeOrmEntity,
  DepartmentOrmEntity,
  PositionOrmEntity,
  LeaveRequestOrmEntity,
  PayrollRunOrmEntity,
  PayrollLineOrmEntity,
  OutboxEventOrmEntity,
  ProcessedEventOrmEntity,
} from './infrastructure/database/entities';

// Domain repository tokens
import { EMPLOYEE_REPOSITORY } from './domain/repositories/employee.repository';
import { PAYROLL_RUN_REPOSITORY } from './domain/repositories/payroll-run.repository';
import { DEPARTMENT_REPOSITORY } from './domain/repositories/department.repository';
import { POSITION_REPOSITORY } from './domain/repositories/position.repository';
import { LEAVE_REQUEST_REPOSITORY } from './domain/repositories/leave-request.repository';

// Infrastructure implementations
import { PostgresEmployeeRepository } from './infrastructure/database/repositories/postgres-employee.repository';
import { PostgresPayrollRunRepository } from './infrastructure/database/repositories/postgres-payroll-run.repository';
import { PostgresDepartmentRepository } from './infrastructure/database/repositories/postgres-department.repository';
import { PostgresPositionRepository } from './infrastructure/database/repositories/postgres-position.repository';
import { PostgresLeaveRequestRepository } from './infrastructure/database/repositories/postgres-leave-request.repository';
import { KafkaEventPublisher } from './infrastructure/kafka/producers/kafka-event-publisher';
import { KafkaEventConsumer } from './infrastructure/kafka/consumers/kafka-event-consumer';
import { RedisCache } from './infrastructure/cache/redis-cache';
import { OutboxRelay } from './infrastructure/outbox/outbox-relay';

// Application ports
import { EVENT_PUBLISHER } from './application/ports/event-publisher.port';
import { CACHE_PORT } from './application/ports/cache.port';

// Use cases
import { HireEmployeeUseCase } from './application/use-cases/hire-employee.use-case';
import { TerminateEmployeeUseCase } from './application/use-cases/terminate-employee.use-case';
import { ProcessPayrollUseCase } from './application/use-cases/process-payroll.use-case';
import { RequestLeaveUseCase } from './application/use-cases/request-leave.use-case';

// Controllers
import { EmployeeController } from './api/controllers/employee.controller';
import { PayrollController } from './api/controllers/payroll.controller';
import { LeaveController } from './api/controllers/leave.controller';
import { DepartmentController } from './api/controllers/department.controller';
import { PositionController } from './api/controllers/position.controller';
import { HealthController } from './infrastructure/health/health.controller';

// Middleware
import { JwtMiddleware } from './api/middleware/jwt.middleware';

const ormEntities = [
  EmployeeOrmEntity,
  DepartmentOrmEntity,
  PositionOrmEntity,
  LeaveRequestOrmEntity,
  PayrollRunOrmEntity,
  PayrollLineOrmEntity,
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
        synchronize: config.get<string>('NODE_ENV') === 'development',
        logging: config.get<boolean>('database.logging'),
      }),
    }),
    TypeOrmModule.forFeature(ormEntities),
    TerminusModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [
    EmployeeController,
    PayrollController,
    LeaveController,
    DepartmentController,
    PositionController,
    HealthController,
  ],
  providers: [
    // Infrastructure → Domain port bindings
    { provide: EMPLOYEE_REPOSITORY, useClass: PostgresEmployeeRepository },
    { provide: PAYROLL_RUN_REPOSITORY, useClass: PostgresPayrollRunRepository },
    { provide: DEPARTMENT_REPOSITORY, useClass: PostgresDepartmentRepository },
    { provide: POSITION_REPOSITORY, useClass: PostgresPositionRepository },
    { provide: LEAVE_REQUEST_REPOSITORY, useClass: PostgresLeaveRequestRepository },
    { provide: EVENT_PUBLISHER, useClass: KafkaEventPublisher },
    { provide: CACHE_PORT, useClass: RedisCache },

    // Infrastructure services
    KafkaEventPublisher,
    KafkaEventConsumer,
    OutboxRelay,

    // Use cases
    HireEmployeeUseCase,
    TerminateEmployeeUseCase,
    ProcessPayrollUseCase,
    RequestLeaveUseCase,
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
