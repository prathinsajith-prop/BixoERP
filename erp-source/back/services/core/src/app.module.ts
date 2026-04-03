import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ClsModule } from 'nestjs-cls';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import configuration from './infrastructure/config/configuration';

// ORM Entities
import { UserOrmEntity } from './infrastructure/persistence/entity/user.orm-entity';
import { RoleOrmEntity } from './infrastructure/persistence/entity/role.orm-entity';
import { PermissionOrmEntity } from './infrastructure/persistence/entity/permission.orm-entity';
import { RefreshTokenOrmEntity } from './infrastructure/persistence/entity/refresh-token.orm-entity';
import { OutboxEventOrmEntity, ProcessedEventOrmEntity } from './infrastructure/persistence/entity/outbox.orm-entity';
import { UserSettingsOrmEntity } from './infrastructure/persistence/entity/user-settings.orm-entity';
import { UserProfileOrmEntity } from './infrastructure/persistence/entity/user-profile.orm-entity';
import { TwoFactorOrmEntity } from './infrastructure/persistence/entity/two-factor.orm-entity';
import { SocialAccountOrmEntity } from './infrastructure/persistence/entity/social-account.orm-entity';
import { OrganizationOrmEntity } from './infrastructure/persistence/entity/organization.orm-entity';
import { UserOrganizationOrmEntity } from './infrastructure/persistence/entity/user-organization.orm-entity';
import { DepartmentOrmEntity } from './infrastructure/persistence/entity/department.orm-entity';
import { DivisionOrmEntity } from './infrastructure/persistence/entity/division.orm-entity';
import { TeamOrmEntity } from './infrastructure/persistence/entity/team.orm-entity';
import { AuditLogOrmEntity } from './infrastructure/persistence/entity/audit-log.orm-entity';
import { LoginHistoryOrmEntity } from './infrastructure/persistence/entity/login-history.orm-entity';
import { ManagerAssignmentOrmEntity } from './infrastructure/persistence/entity/manager-assignment.orm-entity';
import { ManagerSettingsOrmEntity } from './infrastructure/persistence/entity/manager-settings.orm-entity';
import { MembershipPermissionOrmEntity } from './infrastructure/persistence/entity/membership-permission.orm-entity';
import { InviteTokenOrmEntity } from './infrastructure/persistence/entity/invite-token.orm-entity';

// Repositories
import { PostgresUserRepository } from './infrastructure/persistence/repository/postgres-user.repository';
import { PostgresRoleRepository } from './infrastructure/persistence/repository/postgres-role.repository';
import { PostgresPermissionRepository } from './infrastructure/persistence/repository/postgres-permission.repository';
import { PostgresRefreshTokenRepository } from './infrastructure/persistence/repository/postgres-refresh-token.repository';
import { PostgresUserSettingsRepository } from './infrastructure/persistence/repository/postgres-user-settings.repository';
import { PostgresUserProfileRepository } from './infrastructure/persistence/repository/postgres-user-profile.repository';
import { PostgresTwoFactorRepository } from './infrastructure/persistence/repository/postgres-two-factor.repository';
import { PostgresSocialAccountRepository } from './infrastructure/persistence/repository/postgres-social-account.repository';
import { PostgresOrganizationRepository } from './infrastructure/persistence/repository/postgres-organization.repository';
import { PostgresUserOrganizationRepository } from './infrastructure/persistence/repository/postgres-user-organization.repository';
import { PostgresDepartmentRepository } from './infrastructure/persistence/repository/postgres-department.repository';
import { PostgresDivisionRepository } from './infrastructure/persistence/repository/postgres-division.repository';
import { PostgresTeamRepository } from './infrastructure/persistence/repository/postgres-team.repository';
import { PostgresLoginHistoryRepository } from './infrastructure/persistence/repository/postgres-login-history.repository';
import { PostgresInviteTokenRepository } from './infrastructure/persistence/repository/postgres-invite-token.repository';
import { PostgresMembershipPermissionRepository } from './infrastructure/persistence/repository/postgres-membership-permission.repository';

// Infrastructure
import { KafkaEventPublisher } from './infrastructure/messaging/kafka-event-publisher';
import { RedisCache } from './infrastructure/cache/redis-cache';
import { JwtTokenService } from './infrastructure/auth/jwt-token.service';
import { OutboxRelay } from './infrastructure/messaging/outbox-relay';
import { AuditLogService } from './infrastructure/audit/audit-log.service';
import { ManagerService } from './infrastructure/manager/manager.service';
import { NestedSetDepartmentService } from './infrastructure/department/nested-set-department.service';

// Domain Repository Tokens
import { USER_REPOSITORY } from './domain/repository/user.repository';
import { ROLE_REPOSITORY } from './domain/repository/role.repository';
import { PERMISSION_REPOSITORY } from './domain/repository/permission.repository';
import { REFRESH_TOKEN_REPOSITORY } from './domain/repository/refresh-token.repository';
import { SOCIAL_ACCOUNT_REPOSITORY } from './domain/repository/social-account.repository';
import { ORGANIZATION_REPOSITORY } from './domain/repository/organization.repository';
import { USER_ORGANIZATION_REPOSITORY } from './domain/repository/user-organization.repository';
import { DEPARTMENT_REPOSITORY } from './domain/repository/department.repository';
import { DIVISION_REPOSITORY } from './domain/repository/division.repository';
import { TEAM_REPOSITORY } from './domain/repository/team.repository';

// Application Port Tokens
import { EVENT_PUBLISHER } from './application/port/event-publisher.port';
import { CACHE_PORT } from './application/port/cache.port';
import { TOKEN_SERVICE } from './application/port/token-service.port';

// Use Cases
import { RegisterUserUseCase } from './application/use-case/register-user.use-case';
import { LoginUseCase } from './application/use-case/login.use-case';
import { RefreshTokenUseCase } from './application/use-case/refresh-token.use-case';
import { LogoutUseCase } from './application/use-case/logout.use-case';
import { ChangePasswordUseCase } from './application/use-case/change-password.use-case';
import { PasswordResetUseCase } from './application/use-case/password-reset.use-case';
import { ManageRolesUseCase } from './application/use-case/manage-roles.use-case';
import { TwoFactorUseCase } from './application/use-case/two-factor.use-case';
import { SocialLoginUseCase } from './application/use-case/social-login.use-case';
import { OrganizationUseCase } from './application/use-case/organization.use-case';
import { OrgStructureUseCase } from './application/use-case/org-structure.use-case';
import { SelectOrgUseCase } from './application/use-case/select-org.use-case';
import { InvitationUseCase } from './application/use-case/invitation.use-case';

// Controllers
import { AuthController } from './api/controller/auth.controller';
import { AdminController } from './api/controller/admin.controller';
import { HealthController } from './api/controller/health.controller';
import { SettingsController } from './api/controller/settings.controller';
import { ProfileController } from './api/controller/profile.controller';
import { TwoFactorController } from './api/controller/two-factor.controller';
import { SocialLoginController } from './api/controller/social-login.controller';
import { OrganizationController } from './api/controller/organization.controller';
import { OrgStructureController } from './api/controller/org-structure.controller';
import { InvitationController } from './api/controller/invitation.controller';

// Guards
import { JwtAuthGuard } from './api/guard/jwt-auth.guard';
import { PermissionsGuard } from './api/guard/permissions.guard';

// Middleware
import { OrgContextMiddleware } from './api/middleware/org-context.middleware';

const ormEntities = [
  UserOrmEntity,
  RoleOrmEntity,
  PermissionOrmEntity,
  RefreshTokenOrmEntity,
  OutboxEventOrmEntity,
  ProcessedEventOrmEntity,
  UserSettingsOrmEntity,
  UserProfileOrmEntity,
  TwoFactorOrmEntity,
  SocialAccountOrmEntity,
  OrganizationOrmEntity,
  UserOrganizationOrmEntity,
  DepartmentOrmEntity,
  DivisionOrmEntity,
  TeamOrmEntity,
  AuditLogOrmEntity,
  LoginHistoryOrmEntity,
  ManagerAssignmentOrmEntity,
  ManagerSettingsOrmEntity,
  MembershipPermissionOrmEntity,
  InviteTokenOrmEntity,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.database'),
        entities: ormEntities,
        synchronize: config.get<string>('NODE_ENV') === 'development',
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),
    TypeOrmModule.forFeature(ormEntities),
    ScheduleModule.forRoot(),
    ClsModule.forRoot({ global: true, middleware: { mount: true } }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL_MS', 60_000),
          limit: config.get<number>('THROTTLE_LIMIT', 60),
        },
      ],
    }),
  ],
  controllers: [AuthController, AdminController, HealthController, SettingsController, ProfileController, TwoFactorController, SocialLoginController, OrganizationController, OrgStructureController, InvitationController],
  providers: [
    // Infrastructure → Port bindings
    { provide: USER_REPOSITORY, useClass: PostgresUserRepository },
    { provide: ROLE_REPOSITORY, useClass: PostgresRoleRepository },
    { provide: PERMISSION_REPOSITORY, useClass: PostgresPermissionRepository },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: PostgresRefreshTokenRepository },
    { provide: SOCIAL_ACCOUNT_REPOSITORY, useClass: PostgresSocialAccountRepository },
    { provide: ORGANIZATION_REPOSITORY, useClass: PostgresOrganizationRepository },
    { provide: USER_ORGANIZATION_REPOSITORY, useClass: PostgresUserOrganizationRepository },
    { provide: DEPARTMENT_REPOSITORY, useClass: PostgresDepartmentRepository },
    { provide: DIVISION_REPOSITORY, useClass: PostgresDivisionRepository },
    { provide: TEAM_REPOSITORY, useClass: PostgresTeamRepository },
    { provide: EVENT_PUBLISHER, useClass: KafkaEventPublisher },
    { provide: CACHE_PORT, useClass: RedisCache },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },

    // Use Cases
    RegisterUserUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    ChangePasswordUseCase,
    PasswordResetUseCase,
    ManageRolesUseCase,
    TwoFactorUseCase,
    SocialLoginUseCase,
    OrganizationUseCase,
    OrgStructureUseCase,
    SelectOrgUseCase,
    InvitationUseCase,

    // Infrastructure services
    OutboxRelay,
    AuditLogService,
    ManagerService,
    NestedSetDepartmentService,
    PostgresUserSettingsRepository,
    PostgresUserProfileRepository,
    PostgresTwoFactorRepository,
    PostgresSocialAccountRepository,
    PostgresLoginHistoryRepository,
    PostgresInviteTokenRepository,
    PostgresMembershipPermissionRepository,

    // Guards (available for DI)
    JwtAuthGuard,
    PermissionsGuard,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    OrgContextMiddleware,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(OrgContextMiddleware).forRoutes('*');
  }
}
