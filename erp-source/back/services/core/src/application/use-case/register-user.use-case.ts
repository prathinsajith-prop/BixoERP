import { Inject, Injectable } from '@nestjs/common';
import { User } from '../../domain/entity/user.entity';
import { Email } from '../../domain/value-object/email.vo';
import { HashedPassword } from '../../domain/value-object/hashed-password.vo';
import { USER_REPOSITORY, UserRepository } from '../../domain/repository/user.repository';
import { DuplicateEmailException } from '../../domain/exception/domain.exceptions';
import { EVENT_PUBLISHER, EventPublisher } from '../port/event-publisher.port';

export interface RegisterUserCommand {
  tenantId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(cmd: RegisterUserCommand): Promise<{ userId: string }> {
    const email = Email.create(cmd.email);

    const existing = await this.userRepo.findByEmail(cmd.tenantId, email.value);
    if (existing) {
      throw new DuplicateEmailException(email.value);
    }

    const hashedPassword = await HashedPassword.fromPlaintext(cmd.password);
    const user = User.create(cmd.tenantId, email, hashedPassword, cmd.firstName, cmd.lastName);

    // Auto-activate for now (in production, would send verification email)
    user.activate();

    await this.userRepo.save(user);

    for (const event of user.pullDomainEvents()) {
      await this.eventPublisher.publish('erp.auth.user.registered', {
        ...event,
        occurredAt: event.occurredAt.toISOString(),
      });
    }

    return { userId: user.id };
  }
}
