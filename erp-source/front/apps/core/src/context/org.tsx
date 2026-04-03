'use client';

import {
    createContext,
    useContext,
    useMemo,
    type ReactNode,
} from 'react';
import { useAuthStore } from '@/store/auth';

/**
 * Decoded JWT payload fields that relate to org membership.
 * The custom JWT encodes these as snake_case claims.
 */
interface JwtOrgPayload {
    sub?: string;
    org_id?: string;
    tenant_id?: string;
    email?: string;
    org_name?: string;
    org_slug?: string;
    membership_id?: string;
    role_id?: string;
    role_name?: string;
    membership_type?: string;
    permissions?: string[];
}

export interface OrgContextValue {
    userId: string | null;
    orgId: string | null;
    orgName: string | null;
    orgSlug: string | null;
    membershipId: string | null;
    roleId: string | null;
    roleName: string | null;
    membershipType: string | null;
    /** Flat list of "resource:action" or "resource:action:scope" strings */
    permissions: string[];
    /**
     * Returns true if the current user holds the given permission.
     * Scope-aware prefix matching: `hasPermission('invoice', 'approve')` matches
     * `invoice:approve`, `invoice:approve:department`, `invoice:approve:own`, etc.
     */
    hasPermission: (resource: string, action: string, scope?: string) => boolean;
    isReady: boolean;
}

const OrgContext = createContext<OrgContextValue>({
    userId: null,
    orgId: null,
    orgName: null,
    orgSlug: null,
    membershipId: null,
    roleId: null,
    roleName: null,
    membershipType: null,
    permissions: [],
    hasPermission: () => false,
    isReady: false,
});

/** Decode JWT body without verifying signature (signature is verified server-side). */
function decodeJwtPayload(token: string): JwtOrgPayload {
    try {
        const [, body] = token.split('.');
        if (!body) return {};
        const padded = body.replace(/-/g, '+').replace(/_/g, '/');
        const json = atob(padded);
        return JSON.parse(json) as JwtOrgPayload;
    } catch {
        return {};
    }
}

export function OrgProvider({ children }: { children: ReactNode }) {
    const accessToken = useAuthStore((s) => s.accessToken);

    const value = useMemo<OrgContextValue>(() => {
        if (!accessToken) {
            return {
                userId: null,
                orgId: null,
                orgName: null,
                orgSlug: null,
                membershipId: null,
                roleId: null,
                roleName: null,
                membershipType: null,
                permissions: [],
                hasPermission: () => false,
                isReady: false,
            };
        }

        const payload = decodeJwtPayload(accessToken);
        const permissions: string[] = payload.permissions ?? [];

        const hasPermission = (resource: string, action: string, scope?: string): boolean => {
            const prefix = `${resource}:${action}`;
            if (scope) {
                const exact = `${prefix}:${scope}`;
                return permissions.some((p) => p === exact || p === prefix || p === '*:*' || p === `${resource}:*`);
            }
            return permissions.some(
                (p) => p === prefix || p.startsWith(`${prefix}:`) || p === '*:*' || p === `${resource}:*`,
            );
        };

        return {
            userId: payload.sub ?? null,
            orgId: payload.org_id ?? payload.tenant_id ?? null,
            orgName: payload.org_name ?? null,
            orgSlug: payload.org_slug ?? null,
            membershipId: payload.membership_id ?? null,
            roleId: payload.role_id ?? null,
            roleName: payload.role_name ?? null,
            membershipType: payload.membership_type ?? null,
            permissions,
            hasPermission,
            isReady: true,
        };
    }, [accessToken]);

    return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrgContext(): OrgContextValue {
    return useContext(OrgContext);
}
