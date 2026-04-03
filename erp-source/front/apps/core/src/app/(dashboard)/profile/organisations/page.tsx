'use client';

import { useState, useEffect, useCallback } from 'react';
import { authApi } from '@/lib/api/auth';
import { useOrgContext } from '@/context/org';
import { useAuthStore } from '@/store/auth';
import PageHeader from '@/components/page-header';

interface OrgMembership {
    orgId: string;
    orgName: string;
    orgSlug: string;
    role: string;
    membershipType: string;
    isActive: boolean;
    joinedAt?: string;
}

const ROLE_COLOURS: Record<string, string> = {
    OWNER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    ADMIN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    MANAGER: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    MEMBER: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};
function roleBadge(role: string) {
    return ROLE_COLOURS[role?.toUpperCase()] ?? ROLE_COLOURS['MEMBER'];
}

const GRADIENTS = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-rose-500 to-pink-500',
    'from-amber-500 to-orange-500',
    'from-indigo-500 to-blue-600',
];

export default function OrganisationsPage() {
    const { orgId: currentOrgId } = useOrgContext();
    const { switchOrg } = useAuthStore();

    const [orgs, setOrgs] = useState<OrgMembership[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [switching, setSwitching] = useState<string | null>(null);
    const [leaving, setLeaving] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await authApi.myOrganizations();
            // Normalise whichever shape the API returns
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
            setError('Failed to load organisations');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleSwitch = async (orgId: string) => {
        if (orgId === currentOrgId) return;
        setSwitching(orgId);
        try {
            await switchOrg(orgId);
            window.location.reload();
        } catch {
            setError('Failed to switch organisation');
            setSwitching(null);
        }
    };

    const handleLeave = async (orgId: string, role: string) => {
        if (role === 'OWNER') {
            alert('You cannot leave an organisation you own. Transfer ownership first, or delete the organisation.');
            return;
        }
        if (!confirm('Leave this organisation? You will lose access and cannot undo this without a new invitation.')) return;
        setLeaving(orgId);
        try {
            // Soft-deactivate membership via the members endpoint
            await authApi.removeMemberFromOrganization(orgId, 'me');
            await load();
        } catch {
            setError('Failed to leave organisation');
        } finally {
            setLeaving(null);
        }
    };

    return (
        <div className="mx-auto max-w-3xl p-6">
            <PageHeader
                title="My Organisations"
                subtitle="All organisations you belong to. Switch context or manage your membership."
            />

            {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                    <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Loading…
                </div>
            ) : orgs.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-400">You are not a member of any organisations.</p>
            ) : (
                <div className="space-y-3">
                    {orgs.map((org, idx) => {
                        const isActive = org.orgId === currentOrgId;
                        const isSwitching = switching === org.orgId;
                        const isLeaving = leaving === org.orgId;

                        return (
                            <div
                                key={org.orgId}
                                className={`flex items-center gap-4 rounded-2xl border p-4 transition ${isActive
                                        ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/20'
                                        : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                                    }`}
                            >
                                {/* Avatar */}
                                <div
                                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${GRADIENTS[idx % GRADIENTS.length]} text-lg font-bold text-white shadow`}
                                >
                                    {org.orgName?.charAt(0)?.toUpperCase() ?? 'O'}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="truncate font-semibold text-gray-900 dark:text-white">{org.orgName}</p>
                                        {isActive && (
                                            <span className="flex-shrink-0 rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">
                                                Current
                                            </span>
                                        )}
                                    </div>
                                    <p className="truncate text-xs text-gray-400 dark:text-gray-500">/{org.orgSlug}</p>
                                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadge(org.role)}`}>
                                            {org.role}
                                        </span>
                                        {org.membershipType && org.membershipType !== 'REGULAR' && (
                                            <span className="text-xs text-gray-400 dark:text-gray-500">{org.membershipType}</span>
                                        )}
                                        {org.joinedAt && (
                                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                                Joined {new Date(org.joinedAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-shrink-0 flex-col items-end gap-2">
                                    {!isActive && (
                                        <button
                                            onClick={() => handleSwitch(org.orgId)}
                                            disabled={!!switching}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
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
                                    {org.role !== 'OWNER' && (
                                        <button
                                            onClick={() => handleLeave(org.orgId, org.role)}
                                            disabled={isLeaving}
                                            className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                                        >
                                            {isLeaving ? 'Leaving…' : 'Leave'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
