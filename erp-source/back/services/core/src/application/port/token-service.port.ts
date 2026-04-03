export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export interface AccessTokenPayload {
  sub: string;            // user ID
  jti?: string;           // JWT ID for blacklisting
  tenantId: string;
  orgId?: string;         // organization UUID
  orgRole?: string;       // membership role: OWNER | ADMIN | MEMBER
  orgName?: string;       // display name of the active org
  orgSlug?: string;       // URL slug of the active org
  membershipId?: string;  // user_organizations.id — reference for permission overrides
  roleId?: string;        // roles.id for the active membership
  roleName?: string;      // human-readable role name
  membershipType?: string; // MEMBER | EMPLOYEE | CONTRACTOR | etc.
  email: string;
  roles: string[];
  permissions: string[];  // "resource:action:scope" format
}

/** Short-lived token returned when a user belongs to > 1 org at login time. */
export interface PendingOrgTokenPayload {
  sub: string;
  tenantId: string;
  email: string;
  /** true so that select-org guard can detect and allow this route */
  pendingOrgSelection: true;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TokenService {
  generateAccessToken(payload: AccessTokenPayload): string;
  generatePendingOrgToken(payload: PendingOrgTokenPayload): string;
  verifyAccessToken(token: string): AccessTokenPayload;
  verifyPendingOrgToken(token: string): PendingOrgTokenPayload;
  blacklistToken(jti: string, ttlSeconds: number): Promise<void>;
  isBlacklisted(jti: string): Promise<boolean>;
}
