import { Inject, Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { USER_REPOSITORY, UserRepository } from '../../domain/repository/user.repository';
import { HashedPassword } from '../../domain/value-object/hashed-password.vo';
import { CACHE_PORT, CachePort } from '../port/cache.port';
import { EVENT_PUBLISHER, EventPublisher } from '../port/event-publisher.port';
import { EntityNotFoundException, TokenExpiredException } from '../../domain/exception/domain.exceptions';
import { REFRESH_TOKEN_REPOSITORY, RefreshTokenRepository } from '../../domain/repository/refresh-token.repository';
import { ConfigService } from '@nestjs/config';

export interface RequestPasswordResetCommand {
  tenantId: string;
  email: string;
}

export interface ResetPasswordCommand {
  tenantId: string;
  token: string;
  newPassword: string;
}

@Injectable()
export class PasswordResetUseCase {
  private readonly resetTtlMinutes: number;

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokenRepo: RefreshTokenRepository,
    @Inject(CACHE_PORT) private readonly cache: CachePort,
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: EventPublisher,
    private readonly config: ConfigService,
  ) {
    this.resetTtlMinutes = this.config.get<number>('PASSWORD_RESET_TTL_MINUTES', 60);
  }

  async requestReset(cmd: RequestPasswordResetCommand): Promise<{ token: string }> {
    const user = await this.userRepo.findByEmail(cmd.tenantId, cmd.email);
    if (!user) {
      // Don't reveal whether the email exists — return success silently
      return { token: '' };
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const cacheKey = `password_reset:${tokenHash}`;

    await this.cache.set(cacheKey, JSON.stringify({
      userId: user.id,
      tenantId: user.tenantId,
    }), this.resetTtlMinutes * 60);

    await this.eventPublisher.publish('erp.auth.password-reset.requested', {
      eventType: 'auth.password_reset.requested',
      aggregateId: user.id,
      tenantId: user.tenantId,
      occurredAt: new Date().toISOString(),
      payload: {
        email: user.email.value,
        resetToken: rawToken, // notification-svc will embed this in the email link
        expiresInMinutes: this.resetTtlMinutes,
      },
    });

    return { token: rawToken };
  }

  async resetPassword(cmd: ResetPasswordCommand): Promise<void> {
    const tokenHash = createHash('sha256').update(cmd.token).digest('hex');
    const cacheKey = `password_reset:${tokenHash}`;
    const cached = await this.cache.get(cacheKey);

    if (!cached) {
      throw new TokenExpiredException();
    }

    const { userId, tenantId } = JSON.parse(cached);
    if (tenantId !== cmd.tenantId) {
      throw new TokenExpiredException();
    }

    const user = await this.userRepo.findById(tenantId, userId);
    if (!user) {
      throw new EntityNotFoundException('User', userId);
    }

    const newHashed = await HashedPassword.fromPlaintext(cmd.newPassword);
    user.changePassword(newHashed);
    await this.userRepo.update(user);

    // Invalidate the reset token
    await this.cache.del(cacheKey);

    // Revoke all refresh tokens
    await this.refreshTokenRepo.revokeAllByUserId(tenantId, userId);

    for (const event of user.pullDomainEvents()) {
      await this.eventPublisher.publish('erp.auth.user.password-changed', {
        ...event,
        occurredAt: event.occurredAt.toISOString(),
      });
    }
  }
}
