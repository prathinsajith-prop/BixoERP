import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

import { UserOrmEntity } from './entity/user.orm-entity';
import { RoleOrmEntity } from './entity/role.orm-entity';
import { PermissionOrmEntity } from './entity/permission.orm-entity';
import { RefreshTokenOrmEntity } from './entity/refresh-token.orm-entity';
import { OutboxEventOrmEntity, ProcessedEventOrmEntity } from './entity/outbox.orm-entity';
import { UserSettingsOrmEntity } from './entity/user-settings.orm-entity';
import { UserProfileOrmEntity } from './entity/user-profile.orm-entity';
import { TwoFactorOrmEntity } from './entity/two-factor.orm-entity';
import { SocialAccountOrmEntity } from './entity/social-account.orm-entity';
import { OrganizationOrmEntity } from './entity/organization.orm-entity';
import { UserOrganizationOrmEntity } from './entity/user-organization.orm-entity';
import { DepartmentOrmEntity } from './entity/department.orm-entity';
import { DivisionOrmEntity } from './entity/division.orm-entity';
import { TeamOrmEntity } from './entity/team.orm-entity';
import { AuditLogOrmEntity } from './entity/audit-log.orm-entity';
import { ManagerAssignmentOrmEntity } from './entity/manager-assignment.orm-entity';
import { ManagerSettingsOrmEntity } from './entity/manager-settings.orm-entity';
import { MembershipPermissionOrmEntity } from './entity/membership-permission.orm-entity';
import { InviteTokenOrmEntity } from './entity/invite-token.orm-entity';
import { LoginHistoryOrmEntity } from './entity/login-history.orm-entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'erp_app',
  password: process.env.DB_PASSWORD ?? 'erp_secret',
  database: process.env.DB_NAME ?? 'auth_db',
  extra: {
    max: parseInt(process.env.DB_POOL_MAX ?? '20', 10),
    min: 2,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  },
  entities: [
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
    ManagerAssignmentOrmEntity,
    ManagerSettingsOrmEntity,
    MembershipPermissionOrmEntity,
    InviteTokenOrmEntity,
    LoginHistoryOrmEntity,
  ],
  // In Docker the TS sources aren't present — use compiled JS; locally ts-node picks up .ts
  migrations: [
    process.env.NODE_ENV === 'production'
      ? 'dist/infrastructure/persistence/migration/*.js'
      : 'src/infrastructure/persistence/migration/*.ts',
  ],
});
