import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import { createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';
import {
  ORGANIZATION_REPOSITORY,
  OrganizationRepository,
} from '../../domain/repository/organization.repository';
import {
  USER_ORGANIZATION_REPOSITORY,
  UserOrganizationRepository,
} from '../../domain/repository/user-organization.repository';
import { USER_REPOSITORY, UserRepository } from '../../domain/repository/user.repository';
import { ROLE_REPOSITORY, RoleRepository } from '../../domain/repository/role.repository';
import { PERMISSION_REPOSITORY, PermissionRepository } from '../../domain/repository/permission.repository';
import { REFRESH_TOKEN_REPOSITORY, RefreshTokenRepository } from '../../domain/repository/refresh-token.repository';
import { TOKEN_SERVICE, TokenService } from '../port/token-service.port';
import { Organization } from '../../domain/entity/organization.entity';
import { UserOrganization, OrgMemberRole } from '../../domain/entity/user-organization.entity';
import { RefreshToken } from '../../domain/entity/refresh-token.entity';
import { DomainException } from '../../domain/exception/domain.exceptions';

export class OrganizationNotFoundException extends DomainException {
  constructor() {
    super('Organization not found', 'ORGANIZATION_NOT_FOUND');
    this.name = 'OrganizationNotFoundException';
  }
}

export class OrganizationSlugTakenException extends DomainException {
  constructor() {
    super('Organization slug is already taken', 'SLUG_TAKEN');
    this.name = 'OrganizationSlugTakenException';
  }
}

export class NotMemberException extends DomainException {
  constructor() {
    super('You are not a member of this organization', 'NOT_A_MEMBER');
    this.name = 'NotMemberException';
  }
}

@Injectable()
export class OrganizationUseCase {
  private readonly refreshTtlDays: number;

  constructor(
    @Inject(ORGANIZATION_REPOSITORY) private readonly orgRepo: OrganizationRepository,
    @Inject(USER_ORGANIZATION_REPOSITORY) private readonly userOrgRepo: UserOrganizationRepository,
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(ROLE_REPOSITORY) private readonly roleRepo: RoleRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permRepo: PermissionRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokenRepo: RefreshTokenRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    private readonly config: ConfigService,
  ) {
    this.refreshTtlDays = this.config.get<number>('REFRESH_TOKEN_TTL_DAYS', 30);
  }

  // ─── Superuser: Create Organization ───────────────────────────

  async createOrganization(cmd: {
    name: string;
    slug: string;
    description: string;
    ownerId: string;
  }): Promise<Organization> {
    const existing = await this.orgRepo.findBySlug(cmd.slug);
    if (existing) throw new OrganizationSlugTakenException();

    const org = Organization.create(cmd.name, cmd.slug, cmd.description, cmd.ownerId);
    await this.orgRepo.save(org);

    // Auto-add creator as OWNER member
    const membership = UserOrganization.create(cmd.ownerId, org.id, OrgMemberRole.OWNER);
    await this.userOrgRepo.save(membership);

    return org;
  }

  // ─── Superuser: List Organizations ────────────────────────────

  async listOrganizations(page: number, limit: number) {
    return this.orgRepo.findAll(page, limit);
  }

  // ─── Superuser: Get Organization ──────────────────────────────

  async getOrganization(id: string): Promise<Organization> {
    const org = await this.orgRepo.findById(id);
    if (!org) throw new OrganizationNotFoundException();
    return org;
  }

  // ─── Superuser: Update Organization ───────────────────────────

  async updateOrganization(id: string, name?: string, description?: string, slug?: string): Promise<void> {
    const org = await this.orgRepo.findById(id);
    if (!org) throw new OrganizationNotFoundException();
    if (slug !== undefined && slug !== org.slug) {
      const existing = await this.orgRepo.findBySlug(slug);
      if (existing && existing.id !== id) throw new OrganizationSlugTakenException();
    }
    org.update(name ?? org.name, description ?? org.description, slug);
    await this.orgRepo.update(org);
  }

  // ─── Branding ─────────────────────────────────────────────────

  async getBranding(orgId: string) {
    const org = await this.orgRepo.findById(orgId);
    if (!org) throw new OrganizationNotFoundException();
    return {
      primaryColor: org.primaryColor,
      secondaryColor: org.secondaryColor,
      accentColor: org.accentColor,
      logoUrl: org.logoUrl,
      faviconUrl: org.faviconUrl,
      customCss: org.customCss,
    };
  }

  async updateBranding(orgId: string, data: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    logoUrl?: string;
    faviconUrl?: string;
    customCss?: string;
  }): Promise<void> {
    const org = await this.orgRepo.findById(orgId);
    if (!org) throw new OrganizationNotFoundException();
    org.updateBranding(data);
    await this.orgRepo.update(org);
  }

  // ─── Settings ─────────────────────────────────────────────────

  async getSettings(orgId: string): Promise<Record<string, any>> {
    const org = await this.orgRepo.findById(orgId);
    if (!org) throw new OrganizationNotFoundException();
    return org.settings;
  }

  async updateSettings(orgId: string, settings: Record<string, any>): Promise<void> {
    const org = await this.orgRepo.findById(orgId);
    if (!org) throw new OrganizationNotFoundException();
    org.settings = settings;
    org.updatedAt = new Date();
    await this.orgRepo.update(org);
  }

  // ─── Superuser: Add Member to Organization ────────────────────

  async addMember(organizationId: string, userId: string, role: OrgMemberRole): Promise<void> {
    const org = await this.orgRepo.findById(organizationId);
    if (!org) throw new OrganizationNotFoundException();

    const existing = await this.userOrgRepo.findByUserAndOrg(userId, organizationId);
    if (existing) return; // already a member

    const membership = UserOrganization.create(userId, organizationId, role);
    await this.userOrgRepo.save(membership);
  }

  // ─── Superuser: Remove Member ─────────────────────────────────

  async removeMember(organizationId: string, userId: string): Promise<void> {
    await this.userOrgRepo.delete(userId, organizationId);
  }

  // ─── Superuser: List Members ──────────────────────────────────

  async listMembers(organizationId: string) {
    const org = await this.orgRepo.findById(organizationId);
    if (!org) throw new OrganizationNotFoundException();
    const memberships = await this.userOrgRepo.findByOrgId(organizationId);
    const enriched = await Promise.all(
      memberships.map(async (m) => {
        const user = await this.userRepo.findByIdGlobal(m.userId);
        if (!user) return null; // skip orphaned memberships
        return {
          userId: m.userId,
          organizationId: m.organizationId,
          role: m.role,
          joinedAt: m.joinedAt,
          email: user.email?.value ?? '',
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          employeeId: m.employeeId ?? null,
        };
      }),
    );
    return enriched.filter((m): m is NonNullable<typeof m> => m !== null);
  }

  // ─── Superuser: Update Member Role ────────────────────────────

  async updateMemberRole(organizationId: string, userId: string, role: OrgMemberRole): Promise<void> {
    const membership = await this.userOrgRepo.findByUserAndOrg(userId, organizationId);
    if (!membership) throw new NotMemberException();
    await this.userOrgRepo.updateRole(userId, organizationId, role);
  }

  // ─── User: List My Organizations ──────────────────────────────

  async listUserOrganizations(userId: string) {
    const memberships = await this.userOrgRepo.findByUserId(userId);
    const results: Array<{
      organizationId: string;
      name: string;
      slug: string;
      role: string;
    }> = [];

    for (const m of memberships) {
      const org = await this.orgRepo.findById(m.organizationId);
      if (org) {
        results.push({
          organizationId: org.id,
          name: org.name,
          slug: org.slug,
          role: m.role,
        });
      }
    }
    return results;
  }

  // ─── User: Switch Organization ────────────────────────────────

  async switchOrganization(cmd: {
    userId: string;
    currentTenantId: string;
    userTenantId?: string;           // user's home tenant — where their user record lives
    targetOrganizationId: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tenantId: string;
  }> {
    // Verify user is a member of the target organization
    const membership = await this.userOrgRepo.findByUserAndOrg(
      cmd.userId,
      cmd.targetOrganizationId,
    );
    if (!membership) throw new NotMemberException();

    // Enforce: membership must be active — inactive/invited members cannot switch in
    if (!membership.isActive()) throw new NotMemberException();

    const org = await this.orgRepo.findById(cmd.targetOrganizationId);
    if (!org) throw new OrganizationNotFoundException();

    const targetTenantId = org.id; // org.id IS the tenantId

    // Find user in their HOME tenant (userTenantId) — stable across org switches.
    // Falls back to currentTenantId for tokens issued before this field was added.
    const homeTenantId = cmd.userTenantId ?? cmd.currentTenantId;
    const user = await this.userRepo.findById(homeTenantId, cmd.userId);
    if (!user) throw new NotMemberException();

    // Resolve roles/permissions from the user's HOME tenant.
    // Role IDs on the user entity are scoped to their home org, so we look them
    // up there rather than in the target tenant (which may not have them at all).
    const userEntity = user;
    const roles = await this.roleRepo.findByIds(userEntity.tenantId, userEntity.roles);
    const allPermIds = [...new Set(roles.flatMap((r) => r.permissions))];
    const permissions = await this.permRepo.findByIds(userEntity.tenantId, allPermIds);
    const permissionCodes = permissions.map((p) => p.code);

    const roleNames = roles.map((r) => r.name);

    // Generate new tokens scoped to the target organization.
    // tenantId = target org (controls which org operations act on).
    // userTenantId = user's home org (so future switches can always find the user record).
    const accessToken = this.tokenService.generateAccessToken({
      sub: userEntity.id,
      tenantId: targetTenantId,
      userTenantId: userEntity.tenantId,
      orgId: targetTenantId,
      orgRole: membership.role,
      orgName: org.name,
      orgSlug: org.slug,
      membershipId: membership.id,
      membershipType: (membership as any).membershipType ?? 'MEMBER',
      email: userEntity.email.value,
      roles: roleNames,
      permissions: permissionCodes,
    });

    const rawRefreshToken = RefreshToken.generateRawToken();
    const tokenHash = createHash('sha256').update(rawRefreshToken).digest('hex');
    const refreshToken = RefreshToken.create(
      targetTenantId,
      userEntity.id,
      tokenHash,
      this.refreshTtlDays,
    );
    refreshToken.userAgent = cmd.userAgent ?? null;
    refreshToken.ipAddress = cmd.ipAddress ?? null;
    // Store the user's home tenantId so refresh can find the user record
    // even though this token is scoped to the target (switched) org.
    refreshToken.userTenantId = userEntity.tenantId;
    await this.refreshTokenRepo.save(refreshToken);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: this.config.get<number>('ACCESS_TOKEN_TTL_SECONDS', 900),
      tenantId: targetTenantId,
    };
  }
}
