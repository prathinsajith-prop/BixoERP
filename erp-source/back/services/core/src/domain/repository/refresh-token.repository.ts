import { RefreshToken } from '../entity/refresh-token.entity';

export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');

export interface RefreshTokenRepository {
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
  findById(id: string): Promise<RefreshToken | null>;
  findActiveByUserId(tenantId: string, userId: string): Promise<RefreshToken[]>;
  findByUserId(tenantId: string, userId: string, limit: number): Promise<{ tokens: RefreshToken[]; total: number }>;
  save(token: RefreshToken): Promise<void>;
  update(token: RefreshToken): Promise<void>;
  revokeAllByUserId(tenantId: string, userId: string): Promise<void>;
}
