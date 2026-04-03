'use client';

import type { ReactNode } from 'react';
import { useOrgContext } from '@/context/org';

interface CanDoProps {
    resource: string;
    action: string;
    /** Optional scope: 'own' | 'department' | 'organisation' */
    scope?: string;
    /** Rendered when the user lacks the permission. Defaults to null. */
    fallback?: ReactNode;
    children: ReactNode;
}

/**
 * Conditionally renders `children` only when the current user holds the given
 * resource/action (and optional scope) permission derived from their JWT.
 *
 * Usage:
 * ```tsx
 * <CanDo resource="invoice" action="approve">
 *   <ApproveButton />
 * </CanDo>
 *
 * <CanDo resource="member" action="invite" fallback={<p>Admins only</p>}>
 *   <InviteModal />
 * </CanDo>
 * ```
 */
export default function CanDo({ resource, action, scope, fallback = null, children }: CanDoProps) {
    const { hasPermission, isReady } = useOrgContext();
    if (!isReady) return null;
    return hasPermission(resource, action, scope) ? <>{children}</> : <>{fallback}</>;
}
