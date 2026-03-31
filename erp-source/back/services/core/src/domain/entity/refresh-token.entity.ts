import { Entity } from './base.entity';
import { randomBytes } from 'crypto';

export class RefreshToken extends Entity {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByTokenId: string | null;
  userAgent: string | null;
  ipAddress: string | null;

  private constructor(
    tenantId: string,
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    id?: string,
  ) {
    super(tenantId, id);
    this.userId = userId;
    this.tokenHash = tokenHash;
    this.expiresAt = expiresAt;
    this.revokedAt = null;
    this.replacedByTokenId = null;
    this.userAgent = null;
    this.ipAddress = null;
  }

  static create(
    tenantId: string,
    userId: string,
    tokenHash: string,
    ttlDays: number,
  ): RefreshToken {
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
    return new RefreshToken(tenantId, userId, tokenHash, expiresAt);
  }

  static generateRawToken(): string {
    return randomBytes(40).toString('hex');
  }

  static reconstitute(props: {
    id: string;
    tenantId: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
    replacedByTokenId: string | null;
    userAgent: string | null;
    ipAddress: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): RefreshToken {
    const rt = new RefreshToken(props.tenantId, props.userId, props.tokenHash, props.expiresAt, props.id);
    rt.revokedAt = props.revokedAt;
    rt.replacedByTokenId = props.replacedByTokenId;
    rt.userAgent = props.userAgent;
    rt.ipAddress = props.ipAddress;
    (rt as any).createdAt = props.createdAt;
    rt.updatedAt = props.updatedAt;
    return rt;
  }

  isExpired(): boolean {
    return this.expiresAt <= new Date();
  }

  isRevoked(): boolean {
    return this.revokedAt !== null;
  }

  isValid(): boolean {
    return !this.isExpired() && !this.isRevoked();
  }

  revoke(replacedByTokenId?: string): void {
    this.revokedAt = new Date();
    this.replacedByTokenId = replacedByTokenId ?? null;
    this.updatedAt = new Date();
  }
}
