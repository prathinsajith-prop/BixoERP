import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, UserRepository } from '../../domain/repository/user.repository';
import { HashedPassword } from '../../domain/value-object/hashed-password.vo';
import { EntityNotFoundException, InvalidCredentialsException } from '../../domain/exception/domain.exceptions';
import { EVENT_PUBLISHER, EventPublisher } from '../port/event-publisher.port';
import { REFRESH_TOKEN_REPOSITORY, RefreshTokenRepository } from '../../domain/repository/refresh-token.repository';

export interface ChangePasswordCommand {
  tenantId: string;
  userId: string;
  currentPassword: string;
  newPassword: string;
}

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokenRepo: RefreshTokenRepository,
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(cmd: ChangePasswordCommand): Promise<void> {
    const user = await this.userRepo.findById(cmd.tenantId, cmd.userId);
    if (!user) {
      throw new EntityNotFoundException('User', cmd.userId);
    }

    const isCurrentValid = await user.hashedPassword.verify(cmd.currentPassword);
    if (!isCurrentValid) {
      throw new InvalidCredentialsException();
    }

    const newHashed = await HashedPassword.fromPlaintext(cmd.newPassword);
    user.changePassword(newHashed);
    await this.userRepo.update(user);

    // Revoke all refresh tokens (force re-login on other devices)
    await this.refreshTokenRepo.revokeAllByUserId(cmd.tenantId, cmd.userId);

    for (const event of user.pullDomainEvents()) {
      await this.eventPublisher.publish('erp.auth.user.password-changed', {
        ...event,
        occurredAt: event.occurredAt.toISOString(),
      });
    }
  }
}
