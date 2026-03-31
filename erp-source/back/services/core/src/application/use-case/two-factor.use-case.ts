import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID, createHash } from 'crypto';
import { generateSecret, generateURI, verifySync } from 'otplib';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcrypt';
import { PostgresTwoFactorRepository } from '../../infrastructure/persistence/repository/postgres-two-factor.repository';
import { USER_REPOSITORY, UserRepository } from '../../domain/repository/user.repository';
import { ROLE_REPOSITORY, RoleRepository } from '../../domain/repository/role.repository';
import { PERMISSION_REPOSITORY, PermissionRepository } from '../../domain/repository/permission.repository';
import { REFRESH_TOKEN_REPOSITORY, RefreshTokenRepository } from '../../domain/repository/refresh-token.repository';
import { TOKEN_SERVICE, TokenService, TokenPair } from '../port/token-service.port';
import { CACHE_PORT, CachePort } from '../port/cache.port';
import { EVENT_PUBLISHER, EventPublisher } from '../port/event-publisher.port';
import { encryptSecret, decryptSecret, generateRecoveryCodes } from '../../domain/entity/two-factor';
import { RefreshToken } from '../../domain/entity/refresh-token.entity';
import { DomainException } from '../../domain/exception/domain.exceptions';

const SALT_ROUNDS = 12;
const PENDING_2FA_PREFIX = '2fa-pending:';
const PENDING_2FA_TTL = 300; // 5 minutes

export class TwoFactorRequiredException extends DomainException {
  constructor(public readonly twoFactorToken: string) {
    super('Two-factor authentication required', 'TWO_FACTOR_REQUIRED');
    this.name = 'TwoFactorRequiredException';
  }
}

export class InvalidTwoFactorCodeException extends DomainException {
  constructor() {
    super('Invalid two-factor authentication code', 'INVALID_2FA_CODE');
    this.name = 'InvalidTwoFactorCodeException';
  }
}

export class TwoFactorAlreadyEnabledException extends DomainException {
  constructor() {
    super('Two-factor authentication is already enabled', 'TWO_FACTOR_ALREADY_ENABLED');
    this.name = 'TwoFactorAlreadyEnabledException';
  }
}

export class TwoFactorNotEnabledException extends DomainException {
  constructor() {
    super('Two-factor authentication is not enabled', 'TWO_FACTOR_NOT_ENABLED');
    this.name = 'TwoFactorNotEnabledException';
  }
}

export interface SetupResult {
  secret: string;
  qrCodeDataUrl: string;
  otpauthUrl: string;
}

export interface VerifySetupResult {
  recoveryCodes: string[];
}

@Injectable()
export class TwoFactorUseCase {
  private readonly encryptionKey: string;
  private readonly issuer: string;
  private readonly refreshTtlDays: number;

  constructor(
    private readonly twoFactorRepo: PostgresTwoFactorRepository,
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(ROLE_REPOSITORY) private readonly roleRepo: RoleRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionRepo: PermissionRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokenRepo: RefreshTokenRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    @Inject(CACHE_PORT) private readonly cache: CachePort,
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: EventPublisher,
    private readonly config: ConfigService,
  ) {
    this.encryptionKey = this.config.get<string>('jwt.secret')!;
    this.issuer = this.config.get<string>('jwt.issuer', 'ERP')!;
    this.refreshTtlDays = this.config.get<number>('REFRESH_TOKEN_TTL_DAYS', 30);
  }

  /**
   * Step 1: Generate TOTP secret + QR code. Does NOT enable 2FA yet.
   * The secret is returned to the user and stored encrypted (but not enabled).
   */
  async setup(tenantId: string, userId: string): Promise<SetupResult> {
    const existing = await this.twoFactorRepo.findByUserId(tenantId, userId);
    if (existing?.enabled) {
      throw new TwoFactorAlreadyEnabledException();
    }

    const user = await this.userRepo.findById(tenantId, userId);
    if (!user) throw new DomainException('User not found', 'USER_NOT_FOUND');

    const secret = generateSecret();
    const otpauthUrl = generateURI({
      secret,
      issuer: this.issuer,
      label: user.email.value,
    });
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    const encrypted = encryptSecret(secret, this.encryptionKey);

    // Store secret (not yet enabled) — overwrites any previous pending setup
    await this.twoFactorRepo.upsert({
      id: existing?.id ?? randomUUID(),
      tenant_id: tenantId,
      user_id: userId,
      encrypted_secret: encrypted,
      recovery_codes: [],
      enabled: false,
    });

    return { secret, qrCodeDataUrl, otpauthUrl };
  }

  /**
   * Step 2: Verify a TOTP code to confirm the user has configured their authenticator app,
   * then enable 2FA and issue recovery codes.
   */
  async verifySetup(tenantId: string, userId: string, totpCode: string): Promise<VerifySetupResult> {
    const record = await this.twoFactorRepo.findByUserId(tenantId, userId);
    if (!record) throw new DomainException('Complete 2FA setup first', 'SETUP_NOT_STARTED');
    if (record.enabled) throw new TwoFactorAlreadyEnabledException();

    const secret = decryptSecret(record.encrypted_secret, this.encryptionKey);
    const { valid: isValid } = verifySync({ token: totpCode, secret });
    if (!isValid) throw new InvalidTwoFactorCodeException();

    // Generate recovery codes
    const plainCodes = generateRecoveryCodes(8);
    const hashedCodes = await Promise.all(
      plainCodes.map((code) => bcrypt.hash(code, SALT_ROUNDS)),
    );

    record.recovery_codes = hashedCodes;
    record.enabled = true;
    await this.twoFactorRepo.save(record);

    // Notify user that 2FA has been enabled
    const user = await this.userRepo.findById(tenantId, userId);
    await this.publish2faEvent(tenantId, userId, user?.email?.value, 'two-factor.enabled');

    return { recoveryCodes: plainCodes };
  }

  /**
   * Check if a user has 2FA enabled.
   */
  async isEnabled(tenantId: string, userId: string): Promise<boolean> {
    const record = await this.twoFactorRepo.findByUserId(tenantId, userId);
    return record?.enabled === true;
  }

  /**
   * Called during login when 2FA is enabled.
   * Stores a temporary pending-2FA token in cache and throws TwoFactorRequiredException.
   */
  async createPendingChallenge(tenantId: string, userId: string): Promise<string> {
    const token = randomUUID();
    await this.cache.set(
      `${PENDING_2FA_PREFIX}${token}`,
      JSON.stringify({ tenantId, userId }),
      PENDING_2FA_TTL,
    );
    return token;
  }

  /**
   * Step 3 (login): Validate a TOTP code (or recovery code) and issue real tokens.
   */
  async validate(
    twoFactorToken: string,
    code: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<TokenPair> {
    // Retrieve pending challenge
    const raw = await this.cache.get(`${PENDING_2FA_PREFIX}${twoFactorToken}`);
    if (!raw) throw new DomainException('2FA challenge expired or invalid', 'INVALID_2FA_CHALLENGE');

    const { tenantId, userId } = JSON.parse(raw) as { tenantId: string; userId: string };

    const record = await this.twoFactorRepo.findByUserId(tenantId, userId);
    if (!record?.enabled) throw new TwoFactorNotEnabledException();

    const secret = decryptSecret(record.encrypted_secret, this.encryptionKey);
    let valid = verifySync({ token: code, secret }).valid;

    // If TOTP code didn't match, try recovery codes
    if (!valid) {
      valid = await this.tryRecoveryCode(record, code);
    }

    if (!valid) throw new InvalidTwoFactorCodeException();

    // Consume the pending challenge
    await this.cache.del(`${PENDING_2FA_PREFIX}${twoFactorToken}`);

    // Issue real tokens (mirrors LoginUseCase token-issuing logic)
    return this.issueTokens(tenantId, userId, userAgent, ipAddress);
  }

  /**
   * Disable 2FA. Requires password re-verification (handled at controller level) + TOTP code.
   */
  async disable(tenantId: string, userId: string, totpCode: string): Promise<void> {
    const record = await this.twoFactorRepo.findByUserId(tenantId, userId);
    if (!record?.enabled) throw new TwoFactorNotEnabledException();

    const secret = decryptSecret(record.encrypted_secret, this.encryptionKey);
    let valid = verifySync({ token: totpCode, secret }).valid;

    if (!valid) {
      valid = await this.tryRecoveryCode(record, totpCode);
    }

    if (!valid) throw new InvalidTwoFactorCodeException();

    await this.twoFactorRepo.deleteByUserId(tenantId, userId);

    // Notify user that 2FA has been disabled
    const user = await this.userRepo.findById(tenantId, userId);
    await this.publish2faEvent(tenantId, userId, user?.email?.value, 'two-factor.disabled');
  }

  /**
   * Regenerate recovery codes (requires TOTP verification).
   */
  async regenerateRecoveryCodes(
    tenantId: string,
    userId: string,
    totpCode: string,
  ): Promise<string[]> {
    const record = await this.twoFactorRepo.findByUserId(tenantId, userId);
    if (!record?.enabled) throw new TwoFactorNotEnabledException();

    const secret = decryptSecret(record.encrypted_secret, this.encryptionKey);
    const { valid: isValid } = verifySync({ token: totpCode, secret });
    if (!isValid) throw new InvalidTwoFactorCodeException();

    const plainCodes = generateRecoveryCodes(8);
    const hashedCodes = await Promise.all(
      plainCodes.map((c) => bcrypt.hash(c, SALT_ROUNDS)),
    );
    record.recovery_codes = hashedCodes;
    await this.twoFactorRepo.save(record);

    return plainCodes;
  }

  // ─── Private helpers ───────────────────────────────────────

  private async tryRecoveryCode(record: { recovery_codes: string[] } & { id: string }, code: string): Promise<boolean> {
    const normalized = code.trim().toLowerCase();
    for (let i = 0; i < record.recovery_codes.length; i++) {
      const match = await bcrypt.compare(normalized, record.recovery_codes[i]);
      if (match) {
        // Consume the recovery code (one-time use)
        record.recovery_codes.splice(i, 1);
        await this.twoFactorRepo.save(record as any);
        return true;
      }
    }
    return false;
  }

  private async issueTokens(
    tenantId: string,
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<TokenPair> {
    const user = await this.userRepo.findById(tenantId, userId);
    if (!user) throw new DomainException('User not found', 'USER_NOT_FOUND');

    const roles = await this.roleRepo.findByIds(tenantId, user.roles);
    const allPermissionIds = [...new Set(roles.flatMap((r) => r.permissions))];
    const permissions = await this.permissionRepo.findByIds(tenantId, allPermissionIds);
    const permissionCodes = permissions.map((p) => p.code);

    const accessToken = this.tokenService.generateAccessToken({
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email.value,
      roles: roles.map((r) => r.name),
      permissions: permissionCodes,
    });

    const rawRefreshToken = RefreshToken.generateRawToken();
    const tokenHash = createHash('sha256').update(rawRefreshToken).digest('hex');
    const refreshToken = RefreshToken.create(tenantId, userId, tokenHash, this.refreshTtlDays);
    refreshToken.userAgent = userAgent ?? null;
    refreshToken.ipAddress = ipAddress ?? null;
    await this.refreshTokenRepo.save(refreshToken);

    user.recordSuccessfulLogin();
    await this.userRepo.update(user);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: this.config.get<number>('ACCESS_TOKEN_TTL_SECONDS', 900),
    };
  }

  private async publish2faEvent(
    tenantId: string,
    userId: string,
    email: string | undefined,
    eventType: string,
  ): Promise<void> {
    try {
      await this.eventPublisher.publish(eventType.replace(/\./g, '-'), {
        eventId: randomUUID(),
        eventType,
        tenantId,
        occurredAt: new Date().toISOString(),
        payload: { userId, email },
      });
    } catch {
      // Non-critical — don't fail the 2FA operation if notification fails
    }
  }
}
