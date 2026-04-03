import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { createHash, randomBytes, sign as cryptoSign } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { SOCIAL_ACCOUNT_REPOSITORY, SocialAccountRepository } from '../../domain/repository/social-account.repository';
import { SocialAccount, SocialProvider } from '../../domain/entity/social-account.entity';
import { USER_REPOSITORY, UserRepository } from '../../domain/repository/user.repository';
import { ROLE_REPOSITORY, RoleRepository } from '../../domain/repository/role.repository';
import { PERMISSION_REPOSITORY, PermissionRepository } from '../../domain/repository/permission.repository';
import { REFRESH_TOKEN_REPOSITORY, RefreshTokenRepository } from '../../domain/repository/refresh-token.repository';
import { TOKEN_SERVICE, TokenService } from '../port/token-service.port';
import { EVENT_PUBLISHER, EventPublisher } from '../port/event-publisher.port';
import { User, UserStatus } from '../../domain/entity/user.entity';
import { Email } from '../../domain/value-object/email.vo';
import { HashedPassword } from '../../domain/value-object/hashed-password.vo';
import { RefreshToken } from '../../domain/entity/refresh-token.entity';
import { DomainException } from '../../domain/exception/domain.exceptions';
import { TwoFactorUseCase } from './two-factor.use-case';
import { LoginResult } from './login.use-case';

export class SocialLoginException extends DomainException {
  constructor(message: string) {
    super(message, 'SOCIAL_LOGIN_FAILED');
    this.name = 'SocialLoginException';
  }
}

export class SocialProviderNotConfiguredException extends DomainException {
  constructor(provider: string) {
    super(`Social login provider '${provider}' is not configured`, 'PROVIDER_NOT_CONFIGURED');
    this.name = 'SocialProviderNotConfiguredException';
  }
}

export interface SocialUserInfo {
  providerAccountId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

@Injectable()
export class SocialLoginUseCase {
  private readonly logger = new Logger(SocialLoginUseCase.name);
  private readonly refreshTtlDays: number;

  constructor(
    @Inject(SOCIAL_ACCOUNT_REPOSITORY) private readonly socialAccountRepo: SocialAccountRepository,
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(ROLE_REPOSITORY) private readonly roleRepo: RoleRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionRepo: PermissionRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokenRepo: RefreshTokenRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: EventPublisher,
    private readonly config: ConfigService,
    @Inject(forwardRef(() => TwoFactorUseCase)) private readonly twoFactorUseCase: TwoFactorUseCase,
  ) {
    this.refreshTtlDays = this.config.get<number>('REFRESH_TOKEN_TTL_DAYS', 30);
  }

  // ─── Google ─────────────────────────────────────────────────────

  async loginWithGoogle(
    tenantId: string | undefined,
    idToken: string,
    ua?: string,
    ip?: string,
  ): Promise<LoginResult> {
    const clientId = this.config.get<string>('social.google.clientId');
    if (!clientId) throw new SocialProviderNotConfiguredException('google');

    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    );
    if (!res.ok) throw new SocialLoginException('Invalid Google ID token');

    const payload = (await res.json()) as Record<string, any>;
    if (payload.aud !== clientId) {
      throw new SocialLoginException('Google ID token audience mismatch');
    }
    if (!payload.email || payload.email_verified === 'false') {
      throw new SocialLoginException('Google account email not verified');
    }

    const userInfo: SocialUserInfo = {
      providerAccountId: payload.sub,
      email: payload.email,
      firstName: payload.given_name ?? payload.email.split('@')[0],
      lastName: payload.family_name ?? '',
      avatarUrl: payload.picture ?? null,
    };

    return this.handleSocialLogin(tenantId, SocialProvider.GOOGLE, userInfo, ua, ip);
  }

  // ─── GitHub ─────────────────────────────────────────────────────

  async loginWithGithub(
    tenantId: string | undefined,
    code: string,
    redirectUri: string,
    ua?: string,
    ip?: string,
  ): Promise<LoginResult> {
    const clientId = this.config.get<string>('social.github.clientId');
    const clientSecret = this.config.get<string>('social.github.clientSecret');
    if (!clientId || !clientSecret) throw new SocialProviderNotConfiguredException('github');

    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });
    const tokenData = (await tokenRes.json()) as Record<string, any>;
    if (tokenData.error || !tokenData.access_token) {
      throw new SocialLoginException(tokenData.error_description ?? 'GitHub code exchange failed');
    }

    // Fetch user profile + emails in parallel
    const authHeader = { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/vnd.github+json' };
    const [userRes, emailsRes] = await Promise.all([
      fetch('https://api.github.com/user', { headers: authHeader }),
      fetch('https://api.github.com/user/emails', { headers: authHeader }),
    ]);

    if (!userRes.ok) throw new SocialLoginException('Failed to fetch GitHub user profile');
    const userData = (await userRes.json()) as Record<string, any>;

    // Get primary verified email
    let email = userData.email as string | null;
    if (!email && emailsRes.ok) {
      const emails = (await emailsRes.json()) as Array<Record<string, any>>;
      const primary = emails.find((e) => e.primary && e.verified);
      email = primary?.email ?? null;
    }
    if (!email) throw new SocialLoginException('No verified email found on GitHub account');

    const nameParts = (userData.name ?? '').split(' ');
    const userInfo: SocialUserInfo = {
      providerAccountId: String(userData.id),
      email,
      firstName: nameParts[0] || userData.login || email.split('@')[0],
      lastName: nameParts.slice(1).join(' ') || '',
      avatarUrl: userData.avatar_url ?? null,
    };

    return this.handleSocialLogin(tenantId, SocialProvider.GITHUB, userInfo, ua, ip);
  }

  // ─── Microsoft ──────────────────────────────────────────────────

  async loginWithMicrosoft(
    tenantId: string | undefined,
    code: string,
    redirectUri: string,
    ua?: string,
    ip?: string,
  ): Promise<LoginResult> {
    const clientId = this.config.get<string>('social.microsoft.clientId');
    const clientSecret = this.config.get<string>('social.microsoft.clientSecret');
    const msTenantId = this.config.get<string>('social.microsoft.tenantId') ?? 'common';
    if (!clientId || !clientSecret) throw new SocialProviderNotConfiguredException('microsoft');

    // Exchange code for access token
    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${encodeURIComponent(msTenantId)}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          scope: 'openid email profile',
        }),
      },
    );
    const tokenData = (await tokenRes.json()) as Record<string, any>;
    if (tokenData.error || !tokenData.access_token) {
      throw new SocialLoginException(tokenData.error_description ?? 'Microsoft code exchange failed');
    }

    // Fetch user profile from MS Graph
    const meRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!meRes.ok) throw new SocialLoginException('Failed to fetch Microsoft user profile');
    const meData = (await meRes.json()) as Record<string, any>;

    const email = (meData.mail ?? meData.userPrincipalName) as string | null;
    if (!email) throw new SocialLoginException('No email found on Microsoft account');

    const userInfo: SocialUserInfo = {
      providerAccountId: meData.id,
      email,
      firstName: meData.givenName ?? email.split('@')[0],
      lastName: meData.surname ?? '',
      avatarUrl: null,
    };

    return this.handleSocialLogin(tenantId, SocialProvider.MICROSOFT, userInfo, ua, ip);
  }

  // ─── Apple ──────────────────────────────────────────────────────

  async loginWithApple(
    tenantId: string | undefined,
    code: string,
    redirectUri: string,
    firstName?: string,
    lastName?: string,
    ua?: string,
    ip?: string,
  ): Promise<LoginResult> {
    const appleClientId = this.config.get<string>('social.apple.clientId');
    const teamId = this.config.get<string>('social.apple.teamId');
    const keyId = this.config.get<string>('social.apple.keyId');
    const privateKey = this.config.get<string>('social.apple.privateKey');
    if (!appleClientId || !teamId || !keyId || !privateKey) {
      throw new SocialProviderNotConfiguredException('apple');
    }

    const clientSecret = this.generateAppleClientSecret(appleClientId, teamId, keyId, privateKey);

    // Exchange code for tokens
    const tokenRes = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: appleClientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = (await tokenRes.json()) as Record<string, any>;
    if (tokenData.error || !tokenData.id_token) {
      throw new SocialLoginException(tokenData.error ?? 'Apple code exchange failed');
    }

    // Decode id_token payload (trusted — received server-to-server from Apple)
    const idPayload = this.decodeJwtPayload(tokenData.id_token);
    const email = idPayload.email as string | null;
    if (!email) throw new SocialLoginException('No email found in Apple ID token');

    const userInfo: SocialUserInfo = {
      providerAccountId: idPayload.sub,
      email,
      firstName: firstName ?? email.split('@')[0],
      lastName: lastName ?? '',
      avatarUrl: null,
    };

    return this.handleSocialLogin(tenantId, SocialProvider.APPLE, userInfo, ua, ip);
  }

  // ─── Linked accounts management ────────────────────────────────

  async getLinkedAccounts(tenantId: string, userId: string) {
    const accounts = await this.socialAccountRepo.findByUserId(tenantId, userId);
    return accounts.map((a) => ({
      provider: a.provider,
      email: a.email,
      displayName: a.displayName,
      linkedAt: a.createdAt,
    }));
  }

  async unlinkAccount(tenantId: string, userId: string, provider: SocialProvider): Promise<void> {
    await this.socialAccountRepo.delete(tenantId, userId, provider);
  }

  // ─── Core: find or create user, link account, issue tokens ─────

  private async handleSocialLogin(
    tenantId: string | undefined,
    provider: SocialProvider,
    info: SocialUserInfo,
    ua?: string,
    ip?: string,
  ): Promise<LoginResult> {
    // 1. Try to find existing user by email globally if no tenantId
    let socialAccount: SocialAccount | null = null;
    let user: User | null = null;

    if (tenantId) {
      socialAccount = await this.socialAccountRepo.findByProviderAndAccountId(
        tenantId,
        provider,
        info.providerAccountId,
      );
    }

    if (socialAccount) {
      // Returning social user
      user = await this.userRepo.findById(socialAccount.tenantId, socialAccount.userId);
      if (!user) throw new SocialLoginException('Linked user account not found');
      tenantId = user.tenantId;
    } else {
      // 2. Check if a user with this email already exists
      user = tenantId
        ? await this.userRepo.findByEmail(tenantId, info.email)
        : await this.userRepo.findByEmailGlobal(info.email);

      if (user) {
        tenantId = user.tenantId;
      } else if (tenantId) {
        // 3. Create new user (random password — they can set one via password reset)
        const email = Email.create(info.email);
        const randomPassword = randomBytes(32).toString('base64');
        const hashedPassword = await HashedPassword.fromPlaintext(randomPassword);
        user = User.create(tenantId, email, hashedPassword, info.firstName, info.lastName);
        user.activate();
        await this.userRepo.save(user);

        for (const event of user.pullDomainEvents()) {
          await this.eventPublisher.publish('erp.auth.user.registered', {
            ...event,
            occurredAt: event.occurredAt.toISOString(),
          });
        }
      } else {
        throw new SocialLoginException('No account found for this email');
      }

      // 4. Link social account to the user
      socialAccount = SocialAccount.create(
        user.tenantId,
        user.id,
        provider,
        info.providerAccountId,
        info.email,
      );
      socialAccount.displayName = info.firstName + (info.lastName ? ` ${info.lastName}` : '');
      socialAccount.avatarUrl = info.avatarUrl;
      await this.socialAccountRepo.save(socialAccount);
    }

    // Check account status
    if (user.isLocked()) {
      throw new SocialLoginException('Account is locked');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new SocialLoginException('Account is not active');
    }

    // Check 2FA
    const resolvedTenantId = user.tenantId;
    const has2fa = await this.twoFactorUseCase.isEnabled(resolvedTenantId, user.id);
    if (has2fa) {
      const twoFactorToken = await this.twoFactorUseCase.createPendingChallenge(resolvedTenantId, user.id);
      return { twoFactorRequired: true, twoFactorToken, tenantId: resolvedTenantId };
    }

    return this.issueTokens(user, ua, ip);
  }

  private async issueTokens(user: User, ua?: string, ip?: string): Promise<LoginResult> {
    const roles = await this.roleRepo.findByIds(user.tenantId, user.roles);
    const allPermissionIds = [...new Set(roles.flatMap((r) => r.permissions))];
    const permissions = await this.permissionRepo.findByIds(user.tenantId, allPermissionIds);
    const permissionCodes = permissions.map((p) => p.code);

    const accessToken = this.tokenService.generateAccessToken({
      sub: user.id,
      tenantId: user.tenantId,
      userTenantId: user.tenantId,
      email: user.email.value,
      roles: roles.map((r) => r.name),
      permissions: permissionCodes,
    });

    const rawRefreshToken = RefreshToken.generateRawToken();
    const tokenHash = createHash('sha256').update(rawRefreshToken).digest('hex');
    const refreshToken = RefreshToken.create(user.tenantId, user.id, tokenHash, this.refreshTtlDays);
    refreshToken.userAgent = ua ?? null;
    refreshToken.ipAddress = ip ?? null;
    await this.refreshTokenRepo.save(refreshToken);

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
      tenantId: user.tenantId,
    };
  }

  private generateAppleClientSecret(
    clientId: string,
    teamId: string,
    keyId: string,
    privateKey: string,
  ): string {
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: keyId })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        iss: teamId,
        iat: now,
        exp: now + 15777000, // ~6 months
        aud: 'https://appleid.apple.com',
        sub: clientId,
      }),
    ).toString('base64url');

    const signingInput = `${header}.${payload}`;
    const sig = cryptoSign('sha256', Buffer.from(signingInput), {
      key: privateKey,
      dsaEncoding: 'ieee-p1363',
    });

    return `${signingInput}.${sig.toString('base64url')}`;
  }

  private decodeJwtPayload(jwt: string): Record<string, any> {
    const parts = jwt.split('.');
    if (parts.length !== 3) throw new SocialLoginException('Invalid ID token format');
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  }
}
