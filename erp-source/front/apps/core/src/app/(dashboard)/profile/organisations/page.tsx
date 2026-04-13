'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { useOrgContext } from '@/context/org';
import { useAuthStore } from '@/store/auth';
import { showToast } from '@erp/shell';
import PageHeader from '@/components/page-header';
import { OrgAvatar, RoleBadge, ConfirmDialog, TablePageSkeleton, Tooltip, Button } from '@erp/ui';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrgMembership {
    orgId: string;
    orgName: string;
    orgSlug: string;
    role: string;
    membershipType: string;
    isActive: boolean;
    joinedAt?: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrganisationsPage() {
    const router = useRouter();
    const { orgId: currentOrgId } = useOrgContext();
    const { switchOrg } = useAuthStore();

    const [orgs, setOrgs] = useState<OrgMembership[]>([]);
    const [loading, setLoading] = useState(true);
    const [switching, setSwitching] = useState<string | null>(null);
    const [leaveTarget, setLeaveTarget] = useState<OrgMembership | null>(null);
    const [leaving, setLeaving] = useState(false);

    const canCreateOrg = useMemo(
        () => orgs.some((o) => ['OWNER', 'ADMIN', 'DEVELOPER'].includes(o.role.toUpperCase())),
        [orgs],
    );

    // ── Data ──────────────────────────────────────────────────────────────────

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await authApi.myOrganizations();
            const raw: Array<Record<string, unknown>> = data.data ?? [];
            setOrgs(
                raw.map((o) => ({
                    orgId: (o.organisationId ?? o.organizationId ?? o.id ?? '') as string,
                    orgName: (o.name ?? o.orgName ?? '') as string,
                    orgSlug: (o.slug ?? o.orgSlug ?? '') as string,
                    role: (o.role ?? o.roleName ?? 'MEMBER') as string,
                    membershipType: (o.membershipType ?? 'REGULAR') as string,
                    isActive: (o.isActive ?? true) as boolean,
                    joinedAt: o.joinedAt as string | undefined,
                })),
            );
        } catch {
            showToast.error('Failed to load', 'Could not retrieve your organisations.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // ── Actions ───────────────────────────────────────────────────────────────

    const handleSwitch = async (orgId: string) => {
        if (orgId === currentOrgId) return;
        setSwitching(orgId);
        try {
            await switchOrg(orgId);
            window.location.replace('/');
        } catch {
            showToast.error('Something went wrong', 'Failed to switch organisation.');
            setSwitching(null);
        }
    };

    const handleLeaveConfirm = async () => {
        if (!leaveTarget) return;
        setLeaving(true);
        try {
            await authApi.removeMemberFromOrganization(leaveTarget.orgId, 'me');
            showToast.success('Left organisation', `You have left ${leaveTarget.orgName}.`);
            setLeaveTarget(null);
            await load();
        } catch {
            showToast.error('Something went wrong', 'Failed to leave organisation.');
        } finally {
            setLeaving(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    if (loading) return <TablePageSkeleton rows={4} />;

    return (
        <div className="space-y-6">
            <PageHeader
                title="My Organisations"
                subtitle="All organisations you belong to. Switch context or manage your membership."
                actions={
                    canCreateOrg && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => router.push('/organization/new')}
                        >
                            <span className="flex items-center gap-1.5">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Create Organization
                            </span>
                        </Button>
                    )
                }
            />

            {orgs.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] py-16 shadow-[var(--shadow-card)]">
                    <div
                        className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--gogo-primary) 10%, transparent)' }}
                    >
                        <svg className="h-7 w-7" style={{ color: 'var(--gogo-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium" style={{ color: 'var(--gogo-text-primary)' }}>No organisations yet</p>
                    <p className="mt-1 text-xs" style={{ color: 'var(--gogo-text-secondary)' }}>You are not a member of any organisations.</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] shadow-[var(--shadow-card)]">
                    {orgs.map((org, idx) => {
                        const isCurrent = org.orgId === currentOrgId;
                        const isSwitching = switching === org.orgId;
                        const isOwner = org.role === 'OWNER';

                        return (
                            <div
                                key={org.orgId}
                                className="flex items-center gap-4 border-b border-[var(--gogo-divider)] px-5 py-4 last:border-0"
                                style={isCurrent ? { backgroundColor: 'color-mix(in srgb, var(--gogo-primary) 6%, transparent)' } : undefined}
                            >
                                {/* Avatar */}
                                <OrgAvatar name={org.orgName} size="lg" shape="rounded-xl" />

                                {/* Info */}
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="truncate text-sm font-semibold" style={{ color: 'var(--gogo-text-primary)' }}>
                                            {org.orgName}
                                        </p>
                                        {isCurrent && (
                                            <span
                                                className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                                                style={{ backgroundColor: 'var(--gogo-primary)' }}
                                            >
                                                Current
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--gogo-text-secondary)' }}>
                                        /{org.orgSlug}
                                    </p>
                                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                        <RoleBadge role={org.role} />
                                        {org.membershipType && org.membershipType !== 'REGULAR' && (
                                            <span className="text-xs" style={{ color: 'var(--gogo-text-secondary)' }}>
                                                {org.membershipType}
                                            </span>
                                        )}
                                        {org.joinedAt && (
                                            <span className="text-xs" style={{ color: 'var(--gogo-text-secondary)' }}>
                                                Joined {new Date(org.joinedAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex shrink-0 items-center gap-2">
                                    {isCurrent ? (
                                        <Tooltip content="Organisation settings">
                                            <button
                                                onClick={() => router.push('/organization')}
                                                className="flex items-center justify-center rounded-lg p-1.5 transition"
                                                style={{ color: 'var(--gogo-text-secondary)' }}
                                                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--gogo-divider)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--gogo-text-primary)'; }}
                                                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = ''; (e.currentTarget as HTMLButtonElement).style.color = 'var(--gogo-text-secondary)'; }}
                                            >
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.332.183-.581.495-.644.869l-.214 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </button>
                                        </Tooltip>
                                    ) : (
                                        <button
                                            onClick={() => handleSwitch(org.orgId)}
                                            disabled={!!switching}
                                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                            style={{ backgroundColor: 'var(--gogo-primary)' }}
                                        >
                                            {isSwitching ? (
                                                <>
                                                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                    </svg>
                                                    Switching…
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                                                    </svg>
                                                    Switch
                                                </>
                                            )}
                                        </button>
                                    )}
                                    {!isOwner && (
                                        <button
                                            onClick={() => setLeaveTarget(org)}
                                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                                        >
                                            Leave
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Leave confirmation dialog */}
            <ConfirmDialog
                open={!!leaveTarget}
                onClose={() => setLeaveTarget(null)}
                onConfirm={handleLeaveConfirm}
                variant="danger"
                title={`Leave ${leaveTarget?.orgName ?? 'organisation'}?`}
                message="You will lose access immediately. You cannot undo this without a new invitation."
                confirmLabel="Leave organisation"
                cancelLabel="Cancel"
                loading={leaving}
            />
        </div>
    );
}
