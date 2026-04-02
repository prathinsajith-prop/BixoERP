import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID } from 'crypto';
import { TokenService, AccessTokenPayload } from '../../application/port/token-service.port';
import { CachePort } from '../../application/port/cache.port';
import { Inject } from '@nestjs/common';
import { CACHE_PORT } from '../../application/port/cache.port';

@Injectable()
export class JwtTokenService implements TokenService {
  private readonly logger = new Logger(JwtTokenService.name);
  private readonly secret: string;
  private readonly ttl: number;
  private readonly issuer: string;

  constructor(
    private readonly config: ConfigService,
    @Inject(CACHE_PORT) private readonly cache: CachePort,
  ) {
    this.secret = this.config.get<string>('jwt.secret')!;
    this.ttl = this.config.get<number>('jwt.accessTokenTtl')!;
    this.issuer = this.config.get<string>('jwt.issuer')!;
  }

  generateAccessToken(payload: AccessTokenPayload): string {
    const now = Math.floor(Date.now() / 1000);
    const jti = randomUUID();

    const header = { alg: 'HS256', typ: 'JWT' };
    const body = {
      ...payload,
      // snake_case aliases so all downstream services can read either form
      tenant_id: payload.tenantId,
      org_id: payload.orgId ?? payload.tenantId,
      org_role: payload.orgRole ?? null,
      iss: this.issuer,
      iat: now,
      exp: now + this.ttl,
      jti,
    };

    const headerB64 = this.base64UrlEncode(JSON.stringify(header));
    const bodyB64 = this.base64UrlEncode(JSON.stringify(body));
    const signature = this.sign(`${headerB64}.${bodyB64}`);

    return `${headerB64}.${bodyB64}.${signature}`;
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [headerB64, bodyB64, signature] = parts;
    const expectedSig = this.sign(`${headerB64}.${bodyB64}`);

    if (!this.timingSafeCompare(signature, expectedSig)) {
      throw new Error('Invalid token signature');
    }

    const body = JSON.parse(this.base64UrlDecode(bodyB64));
    const now = Math.floor(Date.now() / 1000);

    if (body.exp && body.exp < now) {
      throw new Error('Token expired');
    }

    if (body.iss !== this.issuer) {
      throw new Error('Invalid issuer');
    }

    return {
      sub: body.sub,
      jti: body.jti,
      tenantId: body.tenantId ?? body.tenant_id,
      orgId: body.orgId ?? body.org_id ?? body.tenantId ?? body.tenant_id,
      orgRole: body.orgRole ?? body.org_role ?? undefined,
      email: body.email,
      roles: body.roles,
      permissions: body.permissions,
    };
  }

  async blacklistToken(jti: string, ttlSeconds: number): Promise<void> {
    await this.cache.set(`blacklist:${jti}`, '1', ttlSeconds);
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    const val = await this.cache.get(`blacklist:${jti}`);
    return val !== null;
  }

  private sign(data: string): string {
    return this.base64UrlEncode(
      createHmac('sha256', this.secret).update(data).digest(),
    );
  }

  private base64UrlEncode(data: string | Buffer): string {
    const buf = typeof data === 'string' ? Buffer.from(data) : data;
    return buf.toString('base64url');
  }

  private base64UrlDecode(data: string): string {
    return Buffer.from(data, 'base64url').toString('utf-8');
  }

  private timingSafeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    let result = 0;
    for (let i = 0; i < bufA.length; i++) {
      result |= bufA[i] ^ bufB[i];
    }
    return result === 0;
  }
}
