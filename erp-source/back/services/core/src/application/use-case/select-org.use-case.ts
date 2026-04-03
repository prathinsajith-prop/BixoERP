import { Inject, Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
import { USER_REPOSITORY, UserRepository } from '../../domain/repository/user.repository';
import { ROLE_REPOSITORY, RoleRepository } from '../../domain/repository/role.repository';
import { PERMISSION_REPOSITORY, PermissionRepository } from '../../domain/repository/permission.repository';
import { REFRESH_TOKEN_REPOSITORY, RefreshTokenRepository } from '../../domain/repository/refresh-token.repository';
import { USER_ORGANIZATION_REPOSITORY, UserOrganizationRepository } from '../../domain/repository/user-organization.repository';
import { ORGANIZATION_REPOSITORY, OrganizationRepository } from '../../domain/repository/organization.repository';
import { TOKEN_SERVICE, TokenService } from '../port/token-service.port';
import { CACHE_PORT, CachePort } from '../port/cache.port';
import { RefreshToken } from '../../domain/entity/refresh-token.entity';
import { ConfigService } from '@nestjs/config';

export interface SelectOrgCommand {
    pendingToken: string;
    orgId: string;
    userAgent?: string;
    ipAddress?: string;
}

export interface SelectOrgResult {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tenantId: string;
}

@Injectable()
export class SelectOrgUseCase {
    constructor(
        @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
        @Inject(ROLE_REPOSITORY) private readonly roleRepo: RoleRepository,
        @Inject(PERMISSION_REPOSITORY) private readonly permissionRepo: PermissionRepository,
        @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokenRepo: RefreshTokenRepository,
        @Inject(USER_ORGANIZATION_REPOSITORY) private readonly userOrgRepo: UserOrganizationRepository,
        @Inject(ORGANIZATION_REPOSITORY) private readonly orgRepo: OrganizationRepository,
        @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
        @Inject(CACHE_PORT) private readonly cache: CachePort,
        private readonly config: ConfigService,
    ) { }

    async execute(cmd: SelectOrgCommand): Promise<SelectOrgResult> {
        // Verify the short-lived pending token
        let pending: ReturnType<TokenService['verifyPendingOrgToken']>;
        try {
            pending = this.tokenService.verifyPendingOrgToken(cmd.pendingToken);
        } catch {
            throw new UnauthorizedException('Invalid or expired pending token');
        }

        const user = await this.userRepo.findById(pending.tenantId, pending.sub);
        if (!user) throw new UnauthorizedException('User not found');

        const memberships = await this.userOrgRepo.findByUserId(user.id);
        const membership = memberships.find(
            (m) => m.organizationId === cmd.orgId && m.isActive(),
        );
        if (!membership) {
            throw new BadRequestException('User is not an active member of the selected organisation');
        }

        const org = await this.orgRepo.findById(cmd.orgId);
        if (!org) throw new BadRequestException('Organisation not found');

        // Resolve permissions
        const cacheKey = `perms:${pending.tenantId}:${user.id}`;
        let permissionCodes: string[];
        let roleNames: string[];
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            const parsed = JSON.parse(cached);
            permissionCodes = parsed.permissionCodes;
            roleNames = parsed.roleNames;
        } else {
            const roles = await this.roleRepo.findByIds(pending.tenantId, user.roles);
            const allPermissionIds = [...new Set(roles.flatMap((r) => r.permissions))];
            const permissions = await this.permissionRepo.findByIds(pending.tenantId, allPermissionIds);
            permissionCodes = permissions.map((p) => p.code);
            roleNames = roles.map((r) => r.name);
            await this.cache.set(cacheKey, JSON.stringify({ permissionCodes, roleNames }), 300);
        }

        const accessToken = this.tokenService.generateAccessToken({
            sub: user.id,
            tenantId: user.tenantId,
            userTenantId: user.tenantId,  // home tenant — stable across org switches
            orgId: org.id,
            orgRole: membership.role,
            orgName: org.name,
            orgSlug: org.slug,
            membershipId: membership.id,
            membershipType: (membership as any).membershipType ?? 'MEMBER',
            email: user.email.value,
            roles: roleNames,
            permissions: permissionCodes,
        });

        // Issue a fresh refresh token scoped to this session
        const refreshTtlDays = this.config.get<number>('REFRESH_TOKEN_TTL_DAYS', 30);
        const rawRefreshToken = RefreshToken.generateRawToken();
        const tokenHash = createHash('sha256').update(rawRefreshToken).digest('hex');
        const refreshToken = RefreshToken.create(
            user.tenantId,
            user.id,
            tokenHash,
            refreshTtlDays,
        );
        refreshToken.userAgent = cmd.userAgent ?? null;
        refreshToken.ipAddress = cmd.ipAddress ?? null;
        await this.refreshTokenRepo.save(refreshToken);

        return {
            accessToken,
            refreshToken: rawRefreshToken,
            expiresIn: this.config.get<number>('ACCESS_TOKEN_TTL_SECONDS', 900),
            tenantId: user.tenantId,
        };
    }
}
