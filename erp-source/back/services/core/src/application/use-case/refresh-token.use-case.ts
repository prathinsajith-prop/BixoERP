import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { USER_REPOSITORY, UserRepository } from '../../domain/repository/user.repository';
import { ROLE_REPOSITORY, RoleRepository } from '../../domain/repository/role.repository';
import { PERMISSION_REPOSITORY, PermissionRepository } from '../../domain/repository/permission.repository';
import { REFRESH_TOKEN_REPOSITORY, RefreshTokenRepository } from '../../domain/repository/refresh-token.repository';
import { TOKEN_SERVICE, TokenService, TokenPair } from '../port/token-service.port';
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

    const user = await this.userRepo.findById(existingToken.tenantId, existingToken.userId);
    if (!user || !user.canLogin()) {
      throw new EntityNotFoundException('User', existingToken.userId);
    }

    // Rotate: revoke old, create new
    const rawNewToken = RefreshToken.generateRawToken();
    const newTokenHash = createHash('sha256').update(rawNewToken).digest('hex');
    const newRefreshToken = RefreshToken.create(existingToken.tenantId, user.id, newTokenHash, this.refreshTtlDays);
    newRefreshToken.userAgent = cmd.userAgent ?? null;
    newRefreshToken.ipAddress = cmd.ipAddress ?? null;

    existingToken.revoke(newRefreshToken.id);
    await this.refreshTokenRepo.update(existingToken);
    await this.refreshTokenRepo.save(newRefreshToken);

    // Resolve permissions
    const roles = await this.roleRepo.findByIds(user.tenantId, user.roles);
    const allPermissionIds = [...new Set(roles.flatMap((r) => r.permissions))];
    const permissions = await this.permissionRepo.findByIds(user.tenantId, allPermissionIds);
    const permissionCodes = permissions.map((p) => p.code);

    const accessToken = this.tokenService.generateAccessToken({
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email.value,
      roles: roles.map((r) => r.name),
      permissions: permissionCodes,
    });

    return {
      accessToken,
      refreshToken: rawNewToken,
      expiresIn: this.config.get<number>('ACCESS_TOKEN_TTL_SECONDS', 900),
    };
  }
}
