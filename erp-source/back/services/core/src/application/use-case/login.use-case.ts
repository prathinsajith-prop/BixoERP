import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { createHash } from 'crypto';
import { USER_REPOSITORY, UserRepository } from '../../domain/repository/user.repository';
import { ROLE_REPOSITORY, RoleRepository } from '../../domain/repository/role.repository';
import { PERMISSION_REPOSITORY, PermissionRepository } from '../../domain/repository/permission.repository';
import { REFRESH_TOKEN_REPOSITORY, RefreshTokenRepository } from '../../domain/repository/refresh-token.repository';
import { USER_ORGANIZATION_REPOSITORY, UserOrganizationRepository } from '../../domain/repository/user-organization.repository';
import { PostgresLoginHistoryRepository } from '../../infrastructure/persistence/repository/postgres-login-history.repository';
import { TOKEN_SERVICE, TokenService } from '../port/token-service.port';
import { EVENT_PUBLISHER, EventPublisher } from '../port/event-publisher.port';
import { CACHE_PORT, CachePort } from '../port/cache.port';
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
    @Inject(USER_ORGANIZATION_REPOSITORY) private readonly userOrgRepo: UserOrganizationRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: EventPublisher,
    @Inject(CACHE_PORT) private readonly cache: CachePort,
    private readonly config: ConfigService,
    @Inject(forwardRef(() => TwoFactorUseCase)) private readonly twoFactorUseCase: TwoFactorUseCase,
    private readonly loginHistoryRepo: PostgresLoginHistoryRepository,
  ) {
    this.maxAttempts = this.config.get<number>('MAX_LOGIN_ATTEMPTS', 5);
    this.lockDuration = this.config.get<number>('LOCK_DURATION_MINUTES', 30);
    this.refreshTtlDays = this.config.get<number>('REFRESH_TOKEN_TTL_DAYS', 30);
  }

  async execute(cmd: LoginCommand): Promise<LoginResult> {
    // Always look up by email globally — emails are unique across tenants.
    const user = await this.userRepo.findByEmailGlobal(cmd.email);
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

      // Record failed login
      this.loginHistoryRepo.record({
        tenantId,
        userId: user.id,
        ipAddress: cmd.ipAddress,
        userAgent: cmd.userAgent,
        status: 'FAILURE',
        failureReason: 'Invalid password',
      }).catch(() => { });

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

    // Resolve permissions through roles (cached for 5 min)
    const cacheKey = `perms:${tenantId}:${user.id}`;
    let permissionCodes: string[];
    let roleNames: string[];
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      permissionCodes = parsed.permissionCodes;
      roleNames = parsed.roleNames;
    } else {
      const roles = await this.roleRepo.findByIds(tenantId, user.roles);
      const allPermissionIds = [...new Set(roles.flatMap((r) => r.permissions))];
      const permissions = await this.permissionRepo.findByIds(tenantId, allPermissionIds);
      permissionCodes = permissions.map((p) => p.code);
      roleNames = roles.map((r) => r.name);
      await this.cache.set(cacheKey, JSON.stringify({ permissionCodes, roleNames }), 300);
    }

    // Generate access token
    // Look up the user's active org membership to embed org_id + org_role
    const memberships = await this.userOrgRepo.findByUserId(user.id);
    const activeMembership = memberships.find((m) => m.isActive()) ?? memberships[0] ?? null;
    const accessToken = this.tokenService.generateAccessToken({
      sub: user.id,
      tenantId: user.tenantId,
      orgId: activeMembership?.organizationId ?? user.tenantId,
      orgRole: activeMembership?.role ?? undefined,
      email: user.email.value,
      roles: roleNames,
      permissions: permissionCodes,
    });

    // Generate refresh token
    const rawRefreshToken = RefreshToken.generateRawToken();
    const tokenHash = createHash('sha256').update(rawRefreshToken).digest('hex');
    const refreshToken = RefreshToken.create(tenantId, user.id, tokenHash, this.refreshTtlDays);
    refreshToken.userAgent = cmd.userAgent ?? null;
    refreshToken.ipAddress = cmd.ipAddress ?? null;
    await this.refreshTokenRepo.save(refreshToken);

    // Record successful login history
    this.loginHistoryRepo.record({
      tenantId,
      userId: user.id,
      ipAddress: cmd.ipAddress,
      userAgent: cmd.userAgent,
      status: 'SUCCESS',
    }).catch(() => { });

    // Record success — use targeted update to avoid bumping updated_at on every login
    user.recordSuccessfulLogin();
    await this.userRepo.updateLastLogin(user.id, new Date());

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
