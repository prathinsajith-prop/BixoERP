import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { REFRESH_TOKEN_REPOSITORY, RefreshTokenRepository } from '../../domain/repository/refresh-token.repository';
import { TOKEN_SERVICE, TokenService } from '../port/token-service.port';

export interface LogoutCommand {
  tenantId: string;
  userId: string;
  accessTokenJti?: string;
  accessTokenTtl?: number;
  refreshToken?: string;
}

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokenRepo: RefreshTokenRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
  ) {}

  async execute(cmd: LogoutCommand): Promise<void> {
    // Blacklist the current access token
    if (cmd.accessTokenJti && cmd.accessTokenTtl) {
      await this.tokenService.blacklistToken(cmd.accessTokenJti, cmd.accessTokenTtl);
    }

    // Revoke specific refresh token if provided
    if (cmd.refreshToken) {
      const tokenHash = createHash('sha256').update(cmd.refreshToken).digest('hex');
      const token = await this.refreshTokenRepo.findByTokenHash(tokenHash);
      if (token && token.isValid()) {
        token.revoke();
        await this.refreshTokenRepo.update(token);
      }
    }

    // Revoke all refresh tokens for this user
    await this.refreshTokenRepo.revokeAllByUserId(cmd.tenantId, cmd.userId);
  }
}
