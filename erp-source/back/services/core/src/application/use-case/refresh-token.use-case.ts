import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { USER_REPOSITORY, UserRepository } from '../../domain/repository/user.repository';
import { ROLE_REPOSITORY, RoleRepository } from '../../domain/repository/role.repository';
import { PERMISSION_REPOSITORY, PermissionRepository } from '../../domain/repository/permission.repository';
import { REFRESH_TOKEN_REPOSITORY, RefreshTokenRepository } from '../../domain/repository/refresh-token.repository';
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
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    @Inject(CACHE_PORT) private readonly cache: CachePort,
    private readonly config: ConfigService,
  ) {
    this.refreshTtlDays = this.config.get<number>('REFRESH_TOKEN_TTL_DAYS', 30);
  }

  async execute(cmd: RefreshTokenCommand): Promise<TokenPair> {
    const tokenHash = createHash('sha256').update(cmd.refreshToken).digest('hex');
    const existingToken = await this.refreshTokenRepo.findByTokenHash(tokenHash);

    if (!existingToken) {
      throw new EntityNotFoundException('RefreshToken', 'unknown');
    }

    if (existingToken.isRevoked()) {
      // Possible token reuse attack — revoke all tokens for this user
      await this.refreshTokenRepo.revokeAllByUserId(existingToken.tenantId, existingToken.userId);
      throw new TokenRevokedException();
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

    const accessToken = this.tokenService.generateAccessToken({
      sub: user.id,
      tenantId: activeTenantId,       // active org for operations
      userTenantId: userHomeTenantId, // home org preserved so future switches work
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
