export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export interface AccessTokenPayload {
  sub: string;        // user ID
  jti?: string;       // JWT ID for blacklisting
  tenantId: string;
  orgId?: string;     // organization UUID (equals tenantId; explicit for clarity)
  orgRole?: string;   // membership role: OWNER | ADMIN | MEMBER
  email: string;
  roles: string[];
  permissions: string[];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TokenService {
  generateAccessToken(payload: AccessTokenPayload): string;
  verifyAccessToken(token: string): AccessTokenPayload;
  blacklistToken(jti: string, ttlSeconds: number): Promise<void>;
  isBlacklisted(jti: string): Promise<boolean>;
}
