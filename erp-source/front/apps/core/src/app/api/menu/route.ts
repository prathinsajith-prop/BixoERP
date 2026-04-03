import { NextRequest, NextResponse } from 'next/server';

/**
 * Portal core module menu.
 *
 * Returns nav items for the core (portal) application.
 * The `permission` field is read by the shell's ModuleSidebar to show/hide
 * items based on the current user's org-scoped permissions stored in the JWT.
 *
 * Format: "resource:action" — the shell checks hasPermission(resource, action).
 */

interface MenuItem {
    label: string;
    href: string;
    icon: string;
    permission?: string;
    position: number;
    children?: Omit<MenuItem, 'children'>[];
}

const PORTAL_MENU: MenuItem[] = [
    // Always visible
    { label: 'Dashboard', href: '/', icon: 'LayoutDashboard', position: 1 },
    // Org management — visible to admins and owners
    { label: 'Members', href: '/settings/members', icon: 'Users', permission: 'auth:org-structure:read', position: 2 },
    { label: 'Departments', href: '/settings/departments', icon: 'Building2', permission: 'auth:org-structure:read', position: 3 },
    // User self-service — always visible
    { label: 'Profile', href: '/profile', icon: 'UserCircle', position: 4 },
    { label: 'Organisations', href: '/profile/organisations', icon: 'Globe', position: 5 },
    // Settings — visible to admins
    { label: 'Settings', href: '/settings', icon: 'Settings', permission: 'auth:roles:read', position: 6 },
    // Admin panel sections
    {
        label: 'Users & Roles', href: '/admin/users', icon: 'ShieldCheck',
        permission: 'auth:users:read', position: 7,
        children: [
            { label: 'User Management', href: '/admin/users', icon: 'Users', position: 1 },
            { label: 'Roles & Permissions', href: '/admin/roles', icon: 'Shield', position: 2 },
            { label: 'Invite Members', href: '/settings/members', icon: 'Key', position: 3 },
        ],
    },
    {
        label: 'Organization', href: '/admin/organizations', icon: 'Building2',
        permission: 'auth:org-structure:read', position: 8,
        children: [
            { label: 'Organizations', href: '/admin/organizations', icon: 'Building2', position: 1 },
            { label: 'Divisions', href: '/admin/divisions', icon: 'Layers', position: 2 },
            { label: 'Departments', href: '/admin/departments', icon: 'Layers', position: 3 },
            { label: 'Teams', href: '/admin/teams', icon: 'Users', position: 4 },
            { label: 'Settings', href: '/organization', icon: 'Settings', position: 5 },
        ],
    },
];

function decodeJwtPermissions(token: string): string[] {
    try {
        const [, body] = token.split('.');
        if (!body) return [];
        const padded = body.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(padded)) as { permissions?: string[] };
        return Array.isArray(payload.permissions) ? payload.permissions : [];
    } catch {
        return [];
    }
}

function hasPermission(permissions: string[], required: string): boolean {
    const [resource, action] = required.split(':');
    return permissions.some(
        (p) => p === required || p.startsWith(`${resource}:${action}:`) || p === `${resource}:*` || p === '*:*',
    );
}

export async function GET(request: NextRequest) {
    const auth = request.headers.get('Authorization') ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const permissions = decodeJwtPermissions(token);

    const items = PORTAL_MENU.filter((item) => {
        if (!item.permission) return true;
        if (!token) return false;
        return hasPermission(permissions, item.permission);
    });

    return NextResponse.json({ moduleName: 'Portal', items });
}
