import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { RefreshTokenRepository } from '../../../domain/repository/refresh-token.repository';
import { RefreshToken } from '../../../domain/entity/refresh-token.entity';
import { RefreshTokenOrmEntity } from '../entity/refresh-token.orm-entity';

@Injectable()
export class PostgresRefreshTokenRepository implements RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenOrmEntity)
    private readonly repo: Repository<RefreshTokenOrmEntity>,
  ) { }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const row = await this.repo.findOne({ where: { token_hash: tokenHash } });
    return row ? this.toDomain(row) : null;
  }

  async findActiveByUserId(tenantId: string, userId: string): Promise<RefreshToken[]> {
    const rows = await this.repo.find({
      where: { tenant_id: tenantId, user_id: userId, revoked_at: IsNull() },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByUserId(tenantId: string, userId: string, limit: number): Promise<{ tokens: RefreshToken[]; total: number }> {
    const [rows, total] = await this.repo.findAndCount({
      where: { tenant_id: tenantId, user_id: userId },
      order: { created_at: 'DESC' },
      take: limit,
    });
    return { tokens: rows.map((r) => this.toDomain(r)), total };
  }

  async save(token: RefreshToken): Promise<void> {
    await this.repo.insert(this.toOrm(token));
  }

  async update(token: RefreshToken): Promise<void> {
    await this.repo.update({ id: token.id }, this.toOrm(token));
  }

  async revokeAllByUserId(tenantId: string, userId: string): Promise<void> {
    await this.repo.update(
      { tenant_id: tenantId, user_id: userId, revoked_at: IsNull() },
      { revoked_at: new Date() },
    );
  }

  private toDomain(orm: RefreshTokenOrmEntity): RefreshToken {
    return RefreshToken.reconstitute({
      id: orm.id,
      tenantId: orm.tenant_id,
      userId: orm.user_id,
      tokenHash: orm.token_hash,
      expiresAt: orm.expires_at,
      revokedAt: orm.revoked_at,
      replacedByTokenId: orm.replaced_by_token_id,
      userAgent: orm.user_agent,
      ipAddress: orm.ip_address,
      userTenantId: orm.user_tenant_id ?? null,
      createdAt: orm.created_at,
      updatedAt: orm.updated_at,
    });
  }

  private toOrm(token: RefreshToken): Partial<RefreshTokenOrmEntity> {
    return {
      id: token.id,
      tenant_id: token.tenantId,
      user_id: token.userId,
      token_hash: token.tokenHash,
      expires_at: token.expiresAt,
      revoked_at: token.revokedAt,
      replaced_by_token_id: token.replacedByTokenId,
      user_agent: token.userAgent,
      ip_address: token.ipAddress,
      user_tenant_id: token.userTenantId ?? null,
    };
  }
}
