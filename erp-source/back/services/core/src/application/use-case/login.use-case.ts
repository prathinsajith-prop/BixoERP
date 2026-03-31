import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { createHash } from 'crypto';
import { USER_REPOSITORY, UserRepository } from '../../domain/repository/user.repository';
import { ROLE_REPOSITORY, RoleRepository } from '../../domain/repository/role.repository';
import { PERMISSION_REPOSITORY, PermissionRepository } from '../../domain/repository/permission.repository';
import { REFRESH_TOKEN_REPOSITORY, RefreshTokenRepository } from '../../domain/repository/refresh-token.repository';
import { TOKEN_SERVICE, TokenService, TokenPair } from '../port/token-service.port';
import { EVENT_PUBLISHER, EventPublisher } from '../port/event-publisher.port';
import { RefreshToken } from '../../domain/entity/refresh-token.entity';
import {
  InvalidCredentialsException,
  AccountLockedException,
  AccountInactiveException,
} from '../../domain/exception/domain.exceptions';
import { UserStatus } from '../../domain/entity/user.entity';
import { ConfigService } from '@nestjs/config';
import { TwoFactorUseCase } from './two-factor.use-case';

export interface LoginCommand {
  tenantId?: string;
  email: string;
  password: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface LoginResult {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  tenantId?: string;
  twoFactorRequired?: boolean;
  twoFactorToken?: string;
}

@Injectable()
export class LoginUseCase {
  private readonly maxAttempts: number;
  private readonly lockDuration: number;
  private readonly refreshTtlDays: number;

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(ROLE_REPOSITORY) private readonly roleRepo: RoleRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionRepo: PermissionRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokenRepo: RefreshTokenRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: EventPublisher,
    private readonly config: ConfigService,
    @Inject(forwardRef(() => TwoFactorUseCase)) private readonly twoFactorUseCase: TwoFactorUseCase,
  ) {
    this.maxAttempts = this.config.get<number>('MAX_LOGIN_ATTEMPTS', 5);
    this.lockDuration = this.config.get<number>('LOCK_DURATION_MINUTES', 30);
    this.refreshTtlDays = this.config.get<number>('REFRESH_TOKEN_TTL_DAYS', 30);
  }

  async execute(cmd: LoginCommand): Promise<LoginResult> {
    const user = cmd.tenantId
      ? await this.userRepo.findByEmail(cmd.tenantId, cmd.email)
      : await this.userRepo.findByEmailGlobal(cmd.email);
    if (!user) {
      throw new InvalidCredentialsException();
    }

    const tenantId = user.tenantId;

    if (user.isLocked()) {
      throw new AccountLockedException(user.lockedUntil);
    }

    if (user.status === UserStatus.INACTIVE || user.status === UserStatus.PENDING_VERIFICATION) {
      throw new AccountInactiveException();
    }

    const isValid = await user.hashedPassword.verify(cmd.password);
    if (!isValid) {
      user.recordFailedLogin(this.maxAttempts, this.lockDuration);
      await this.userRepo.update(user);

      for (const event of user.pullDomainEvents()) {
        await this.eventPublisher.publish('erp.auth.user.locked', {
          ...event,
          occurredAt: event.occurredAt.toISOString(),
        });
      }

      throw new InvalidCredentialsException();
    }

    // Check if user has 2FA enabled
    const has2fa = await this.twoFactorUseCase.isEnabled(tenantId, user.id);
    if (has2fa) {
      const twoFactorToken = await this.twoFactorUseCase.createPendingChallenge(
        tenantId,
        user.id,
      );
      return { twoFactorRequired: true, twoFactorToken, tenantId };
    }

    // Resolve permissions through roles
    const roles = await this.roleRepo.findByIds(tenantId, user.roles);
    const allPermissionIds = [...new Set(roles.flatMap((r) => r.permissions))];
    const permissions = await this.permissionRepo.findByIds(tenantId, allPermissionIds);
    const permissionCodes = permissions.map((p) => p.code);

    // Generate access token
    const accessToken = this.tokenService.generateAccessToken({
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email.value,
      roles: roles.map((r) => r.name),
      permissions: permissionCodes,
    });

    // Generate refresh token
    const rawRefreshToken = RefreshToken.generateRawToken();
    const tokenHash = createHash('sha256').update(rawRefreshToken).digest('hex');
    const refreshToken = RefreshToken.create(tenantId, user.id, tokenHash, this.refreshTtlDays);
    refreshToken.userAgent = cmd.userAgent ?? null;
    refreshToken.ipAddress = cmd.ipAddress ?? null;
    await this.refreshTokenRepo.save(refreshToken);

    // Record success
    user.recordSuccessfulLogin();
    await this.userRepo.update(user);

    for (const event of user.pullDomainEvents()) {
      await this.eventPublisher.publish('erp.auth.user.logged-in', {
        ...event,
        occurredAt: event.occurredAt.toISOString(),
      });
    }

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: this.config.get<number>('ACCESS_TOKEN_TTL_SECONDS', 900),
      tenantId,
    };
  }
}
