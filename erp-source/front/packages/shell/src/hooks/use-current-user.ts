"use client";

import { useMemo } from "react";
import { useAuthStore } from "../store/auth";

export interface CurrentUser {
  sub: string;
  tenantId: string;
  email: string;
  roles: string[];
  permissions: string[];
}

function decodeJwtPayload(token: string): CurrentUser | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return {
      sub: payload.sub ?? "",
      tenantId: payload.tenantId ?? "",
      email: payload.email ?? "",
      roles: Array.isArray(payload.roles) ? payload.roles : [],
      permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
    };
  } catch {
    return null;
  }
}

export function useCurrentUser(): CurrentUser | null {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useMemo(() => (accessToken ? decodeJwtPayload(accessToken) : null), [accessToken]);
}

/** Check if the user has at least one permission matching a module namespace (e.g. "hr") */
export function hasModuleAccess(permissions: string[], moduleNamespace: string): boolean {
  return permissions.some((p) => p.startsWith(`${moduleNamespace}:`));
}
