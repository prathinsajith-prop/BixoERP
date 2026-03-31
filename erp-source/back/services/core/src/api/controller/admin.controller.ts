import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../guard/permissions.guard';
import { ZodValidationPipe } from '../pipe/zod-validation.pipe';
import { TenantId } from '../decorator/auth.decorators';
import { ManageRolesUseCase } from '../../application/use-case/manage-roles.use-case';
import {
  CreateRoleDto,
  UpdateRoleDto,
  CreatePermissionDto,
} from '../dto/auth.dto';
import { Inject } from '@nestjs/common';
import { USER_REPOSITORY, UserRepository } from '../../domain/repository/user.repository';
import { ROLE_REPOSITORY, RoleRepository } from '../../domain/repository/role.repository';
import { PERMISSION_REPOSITORY, PermissionRepository } from '../../domain/repository/permission.repository';
import { REFRESH_TOKEN_REPOSITORY, RefreshTokenRepository } from '../../domain/repository/refresh-token.repository';
import { SOCIAL_ACCOUNT_REPOSITORY, SocialAccountRepository } from '../../domain/repository/social-account.repository';
import { USER_ORGANIZATION_REPOSITORY, UserOrganizationRepository } from '../../domain/repository/user-organization.repository';
import { ORGANIZATION_REPOSITORY, OrganizationRepository } from '../../domain/repository/organization.repository';
import { PostgresTwoFactorRepository } from '../../infrastructure/persistence/repository/postgres-two-factor.repository';
import { PostgresUserProfileRepository } from '../../infrastructure/persistence/repository/postgres-user-profile.repository';

@Controller('api/v1/auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminController {
  constructor(
    private readonly manageRoles: ManageRolesUseCase,
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(ROLE_REPOSITORY) private readonly roleRepo: RoleRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionRepo: PermissionRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokenRepo: RefreshTokenRepository,
    @Inject(SOCIAL_ACCOUNT_REPOSITORY) private readonly socialAccountRepo: SocialAccountRepository,
    @Inject(USER_ORGANIZATION_REPOSITORY) private readonly userOrgRepo: UserOrganizationRepository,
    @Inject(ORGANIZATION_REPOSITORY) private readonly orgRepo: OrganizationRepository,
    private readonly twoFactorRepo: PostgresTwoFactorRepository,
    private readonly profileRepo: PostgresUserProfileRepository,
  ) { }

  // ─── Users ─────────────────────────────────────────

  @Get('users')
  @RequirePermissions('auth:users:read')
  async listUsers(
    @TenantId() tenantId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const result = await this.userRepo.findByTenant(
      tenantId,
      parseInt(page, 10),
      Math.min(parseInt(limit, 10), 100),
    );
    return {
      statusCode: 200,
      data: {
        users: result.users.map((u) => ({
          id: u.id,
          email: u.email.value,
          firstName: u.firstName,
          lastName: u.lastName,
          status: u.status,
          roles: u.roles,
          lastLoginAt: u.lastLoginAt,
          createdAt: u.createdAt,
        })),
        total: result.total,
      },
    };
  }

  // ─── Roles ─────────────────────────────────────────

  @Get('users/:userId')
  @RequirePermissions('auth:users:read')
  async getUserDetails(
    @TenantId() tenantId: string,
    @Param('userId') userId: string,
  ) {
    const user = await this.userRepo.findById(tenantId, userId);
    if (!user) throw new NotFoundException('User not found');

    const [
      roles,
      twoFactor,
      socialAccounts,
      userOrgs,
      loginHistory,
      profile,
    ] = await Promise.all([
      this.roleRepo.findByIds(tenantId, user.roles),
      this.twoFactorRepo.findByUserId(tenantId, userId),
      this.socialAccountRepo.findByUserId(tenantId, userId),
      this.userOrgRepo.findByUserId(userId),
      this.refreshTokenRepo.findByUserId(tenantId, userId, 20),
      this.profileRepo.findByUserId(tenantId, userId),
    ]);

    // Resolve permissions for each role
    const allPermissionIds = [...new Set(roles.flatMap((r) => r.permissions))];
    const permissions = allPermissionIds.length > 0
      ? await this.permissionRepo.findByIds(tenantId, allPermissionIds)
      : [];
    const permissionMap = new Map(permissions.map((p) => [p.id, p]));

    // Resolve organization details
    const orgIds = userOrgs.map((uo) => uo.organizationId);
    const orgs = await this.orgRepo.findByIds(orgIds);
    const orgMap = new Map(orgs.map((o) => [o.id, o]));

    return {
      statusCode: 200,
      data: {
        // Overview
        id: user.id,
        email: user.email.value,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        emailVerifiedAt: user.emailVerifiedAt,
        lastLoginAt: user.lastLoginAt,
        passwordChangedAt: user.passwordChangedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        profile,

        // Security
        security: {
          twoFactorEnabled: twoFactor?.enabled === true,
          twoFactorCreatedAt: twoFactor?.created_at ?? null,
          emailVerified: user.emailVerifiedAt !== null,
          failedLoginAttempts: user.failedLoginAttempts,
          lockedUntil: user.lockedUntil,
          isLocked: user.isLocked(),
          loginHistory: loginHistory.tokens.map((t) => ({
            ipAddress: t.ipAddress,
            userAgent: t.userAgent,
            createdAt: t.createdAt,
            revokedAt: t.revokedAt,
          })),
          loginHistoryTotal: loginHistory.total,
          socialAccounts: socialAccounts.map((sa) => ({
            provider: sa.provider,
            email: sa.email,
            displayName: sa.displayName,
            linkedAt: sa.createdAt,
          })),
        },

        // Roles & Permissions
        roles: roles.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          isSystem: r.isSystem,
          permissions: r.permissions
            .map((pid) => permissionMap.get(pid))
            .filter(Boolean)
            .map((p) => ({
              id: p!.id,
              resource: p!.resource,
              action: p!.action,
              code: p!.code,
              description: p!.description,
            })),
        })),
        effectivePermissions: permissions.map((p) => ({
          id: p.id,
          resource: p.resource,
          action: p.action,
          code: p.code,
          description: p.description,
        })),

        // Organizations
        organizations: userOrgs.map((uo) => {
          const org = orgMap.get(uo.organizationId);
          return {
            id: uo.organizationId,
            name: org?.name ?? null,
            slug: org?.slug ?? null,
            role: uo.role,
            joinedAt: uo.joinedAt,
          };
        }),
      },
    };
  }

  @Get('roles')
  @RequirePermissions('auth:roles:read')
  async listRoles(@TenantId() tenantId: string) {
    const roles = await this.manageRoles.listRoles(tenantId);
    return {
      statusCode: 200,
      data: roles.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        permissions: r.permissions,
        isSystem: r.isSystem,
      })),
    };
  }

  @Post('roles')
  @RequirePermissions('auth:roles:write')
  async createRole(
    @Body(new ZodValidationPipe(CreateRoleDto)) dto: CreateRoleDto,
    @TenantId() tenantId: string,
  ) {
    const result = await this.manageRoles.createRole({
      tenantId,
      name: dto.name,
      description: dto.description,
      permissionIds: dto.permissionIds,
    });
    return { statusCode: 201, data: result };
  }

  @Put('roles/:id')
  @RequirePermissions('auth:roles:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateRole(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateRoleDto)) dto: UpdateRoleDto,
    @TenantId() tenantId: string,
  ) {
    await this.manageRoles.updateRole(tenantId, id, dto.name, dto.description, dto.permissionIds);
  }

  @Delete('roles/:id')
  @RequirePermissions('auth:roles:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRole(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    await this.manageRoles.deleteRole(tenantId, id);
  }

  // ─── Role Assignment ───────────────────────────────

  @Post('users/:userId/roles/:roleId')
  @RequirePermissions('auth:roles:assign')
  @HttpCode(HttpStatus.NO_CONTENT)
  async assignRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @TenantId() tenantId: string,
  ) {
    await this.manageRoles.assignRole({ tenantId, userId, roleId });
  }

  @Delete('users/:userId/roles/:roleId')
  @RequirePermissions('auth:roles:assign')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @TenantId() tenantId: string,
  ) {
    await this.manageRoles.removeRole({ tenantId, userId, roleId });
  }

  // ─── Permissions ───────────────────────────────────

  @Get('permissions')
  @RequirePermissions('auth:permissions:read')
  async listPermissions(@TenantId() tenantId: string) {
    const perms = await this.manageRoles.listPermissions(tenantId);
    return {
      statusCode: 200,
      data: perms.map((p) => ({
        id: p.id,
        resource: p.resource,
        action: p.action,
        code: p.code,
        description: p.description,
      })),
    };
  }

  @Post('permissions')
  @RequirePermissions('auth:permissions:write')
  async createPermission(
    @Body(new ZodValidationPipe(CreatePermissionDto)) dto: CreatePermissionDto,
    @TenantId() tenantId: string,
  ) {
    const result = await this.manageRoles.createPermission({
      tenantId,
      resource: dto.resource,
      action: dto.action,
      description: dto.description,
    });
    return { statusCode: 201, data: result };
  }

  @Delete('permissions/:id')
  @RequirePermissions('auth:permissions:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePermission(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    await this.manageRoles.deletePermission(tenantId, id);
  }
}
