import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { USER_REPOSITORY, UserRepository } from '../../domain/repository/user.repository';
import { ROLE_REPOSITORY, RoleRepository } from '../../domain/repository/role.repository';
import { PERMISSION_REPOSITORY, PermissionRepository } from '../../domain/repository/permission.repository';
import { REFRESH_TOKEN_REPOSITORY, RefreshTokenRepository } from '../../domain/repository/refresh-token.repository';
import { USER_ORGANIZATION_REPOSITORY, UserOrganizationRepository } from '../../domain/repository/user-organization.repository';
import { ORGANIZATION_REPOSITORY, OrganizationRepository } from '../../domain/repository/organization.repository';
import { TOKEN_SERVICE, TokenService, TokenPair } from '../port/token-service.port';
import { CACHE_PORT, CachePort } from '../port/cache.port';
import { RefreshToken } from '../../domain/entity/refresh-token.entity';
import {
  TokenExpiredException,
  TokenRevokedException,
  EntityNotFoundException,
} from '../../domain/exception/domain.exceptions';
import { ConfigService } from '@nestjs/config';

export interface RefreshTokenCommand {
  refreshToken: string;
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class RefreshTokenUseCase {
  private readonly refreshTtlDays: number;

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
  ) {
    this.refreshTtlDays = this.config.get<number>('REFRESH_TOKEN_TTL_DAYS', 30);
  }

  async execute(cmd: RefreshTokenCommand): Promise<TokenPair> {
    const tokenHash = createHash('sha256').update(cmd.refreshToken).digest('hex');
    let existingToken = await this.refreshTokenRepo.findByTokenHash(tokenHash);

    if (!existingToken) {
      throw new EntityNotFoundException('RefreshToken', 'unknown');
    }

    if (existingToken.isRevoked()) {
      // Before treating this as a theft attempt, check whether the token was rotated
      // very recently.  This handles the common "browser page-cancel" race:
      //   1. User hits F5  →  browser sends RT₀  →  backend rotates RT₀ → RT₁ and
      //      writes Set-Cookie with RT₁ in the response.
      //   2. User hits F5 again BEFORE the response arrives  →  browser cancels the
      //      first request.  Backend has already committed the rotation but the
      //      browser never received the new cookie; it still holds RT₀.
      //   3. Next page load sends RT₀ again  →  backend finds it revoked.
      //
      // Grace window (30 s): if RT₀ was rotated within the last 30 seconds AND it
      // has a recorded replacement, treat this as an accidental double-refresh and
      // re-rotate from the replacement token instead of locking the user out.
      // The window is short enough that a genuine theft/replay would not qualify.
      const GRACE_MS = 30_000;
      const wasRecentlyRotated =
        existingToken.revokedAt !== null &&
        Date.now() - existingToken.revokedAt.getTime() < GRACE_MS &&
        existingToken.replacedByTokenId !== null;

      if (wasRecentlyRotated) {
        const replacement = await this.refreshTokenRepo.findById(existingToken.replacedByTokenId!);
        if (replacement && replacement.isValid()) {
          // Recover: rotate from the replacement token — the browser will get the
          // new cookie and the stale RT₀ is harmlessly ignored.
          existingToken = replacement;
        } else {
          // Replacement is gone / also revoked — cookie chain is broken; log out cleanly.
          throw new TokenRevokedException();
        }
      } else {
        // Token was revoked a while ago — likely a genuine replay/theft attempt.
        // Revoke all tokens for this user as a security precaution.
        await this.refreshTokenRepo.revokeAllByUserId(existingToken.tenantId, existingToken.userId);
        throw new TokenRevokedException();
      }
    }

    if (existingToken.isExpired()) {
      throw new TokenExpiredException();
    }

    // userTenantId is the home org where the user record lives.
    // tenantId is the active org (may differ after an org switch).
    const userHomeTenantId = existingToken.userTenantId ?? existingToken.tenantId;
    const activeTenantId = existingToken.tenantId;

    const user = await this.userRepo.findById(userHomeTenantId, existingToken.userId);
    if (!user || !user.canLogin()) {
      throw new EntityNotFoundException('User', existingToken.userId);
    }

    // Rotate: revoke old, create new — preserve userTenantId so future refreshes work
    const rawNewToken = RefreshToken.generateRawToken();
    const newTokenHash = createHash('sha256').update(rawNewToken).digest('hex');
    const newRefreshToken = RefreshToken.create(activeTenantId, user.id, newTokenHash, this.refreshTtlDays);
    newRefreshToken.userAgent = cmd.userAgent ?? null;
    newRefreshToken.ipAddress = cmd.ipAddress ?? null;
    newRefreshToken.userTenantId = existingToken.userTenantId; // preserve home org

    existingToken.revoke(newRefreshToken.id);
    await this.refreshTokenRepo.update(existingToken);
    await this.refreshTokenRepo.save(newRefreshToken);

    // Resolve permissions from the ACTIVE org (not the user's home org)
    // Resolve permissions from the user's HOME tenant (where their roles actually live).
    // The active tenant may differ after an org switch, but role IDs on the user entity
    // are always scoped to their home org.
    const cacheKey = `perms:${userHomeTenantId}:${user.id}`;
    let permissionCodes: string[];
    let roleNames: string[];
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      permissionCodes = parsed.permissionCodes;
      roleNames = parsed.roleNames;
    } else {
      const roles = await this.roleRepo.findByIds(userHomeTenantId, user.roles);
      const allPermissionIds = [...new Set(roles.flatMap((r) => r.permissions))];
      const permissions = await this.permissionRepo.findByIds(userHomeTenantId, allPermissionIds);
      permissionCodes = permissions.map((p) => p.code);
      roleNames = roles.map((r) => r.name);
      await this.cache.set(cacheKey, JSON.stringify({ permissionCodes, roleNames }), 300);
    }

    // Resolve org membership for the active org to include orgRole in the token
    const memberships = await this.userOrgRepo.findByUserId(user.id);
    const membership = memberships.find(
      (m) => m.organizationId === activeTenantId && m.isActive(),
    );
    const org = membership ? await this.orgRepo.findById(activeTenantId) : null;

    const accessToken = this.tokenService.generateAccessToken({
      sub: user.id,
      tenantId: activeTenantId,       // active org for operations
      userTenantId: userHomeTenantId, // home org preserved so future switches work
      orgId: activeTenantId,
      orgRole: membership?.role ?? undefined,
      orgName: org?.name ?? undefined,
      orgSlug: org?.slug ?? undefined,
      membershipId: membership?.id ?? undefined,
      membershipType: (membership as any)?.membershipType ?? undefined,
      email: user.email.value,
      roles: roleNames,
      permissions: permissionCodes,
    });

    return {
      accessToken,
      refreshToken: rawNewToken,
      expiresIn: this.config.get<number>('ACCESS_TOKEN_TTL_SECONDS', 900),
    };
  }
}
