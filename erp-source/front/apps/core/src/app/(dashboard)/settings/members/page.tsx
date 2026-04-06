'use client';

import { useState, useEffect, useCallback } from 'react';
import { authApi } from '@/lib/api/auth';
import { useOrgContext } from '@/context/org';
import { showToast } from '@erp/shell';
import CanDo from '@/components/can-do';
import PageHeader from '@/components/page-header';
import Button from '@/components/ui/button';

interface Member {
    userId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    membershipType: string;
    joinedAt?: string;
}

interface PendingInvite {
    id: string;
    email: string;
    roleName: string;
    status: string;
    expiresAt?: string;
    createdAt?: string;
    invitedBy?: string;
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

// ── Invite Modal ──────────────────────────────────────────────────────────────
interface InviteModalProps {
    orgId: string;
    onClose: () => void;
    onInvited: () => void;
}

function InviteModal({ orgId, onClose, onInvited }: InviteModalProps) {
    const [email, setEmail] = useState('');
    const [roleName, setRoleName] = useState('MEMBER');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setLoading(true);
        try {
            await authApi.inviteMember({ organisationId: orgId, email, roleName, message: message || undefined });
            showToast.success('Invitation sent', `An invite has been sent to ${email}.`);
            onInvited();
            onClose();
        } catch (err: unknown) {
            showToast.error('Something went wrong', (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to send invitation');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Invite member</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="colleague@example.com"
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                        <select
                            value={roleName}
                            onChange={(e) => setRoleName(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="MEMBER">Member</option>
                            <option value="MANAGER">Manager</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Message <span className="text-gray-400">(optional)</span>
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={2}
                            placeholder="Add a personal message…"
                            className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                        <Button loading={loading} type="submit">Send invitation</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MembersPage() {
    const { orgId, roleName } = useOrgContext();
    const isAdminOrOwner = roleName === 'OWNER' || roleName === 'ADMIN';

    const [members, setMembers] = useState<Member[]>([]);
    const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [tab, setTab] = useState<'members' | 'invites'>('members');

    const load = useCallback(async () => {
        if (!orgId) return;
        setLoading(true);
        try {
            const [membersRes, invitesRes] = await Promise.allSettled([
                authApi.listOrganizationMembers(orgId),
                isAdminOrOwner ? authApi.listPendingInvites(orgId) : Promise.resolve({ data: { data: [] } }),
            ]);
            if (membersRes.status === 'fulfilled') setMembers(membersRes.value.data.data ?? []);
            if (invitesRes.status === 'fulfilled') setPendingInvites((invitesRes.value as { data: { data: PendingInvite[] } }).data.data ?? []);
        } catch {
            showToast.error('Something went wrong', 'Failed to load members');
        } finally {
            setLoading(false);
        }
    }, [orgId, isAdminOrOwner]);

    useEffect(() => { load(); }, [load]);

    const handleRevoke = async (inviteId: string) => {
        if (!orgId) return;
        try {
            await authApi.revokeInvite(inviteId, orgId);
            showToast.warning('Invitation revoked');
            setPendingInvites((p) => p.filter((i) => i.id !== inviteId));
        } catch {
            showToast.error('Something went wrong', 'Failed to revoke invitation');
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!orgId) return;
        if (!confirm('Remove this member from the organisation?')) return;
        try {
            await authApi.removeMemberFromOrganization(orgId, userId);
            showToast.warning('Member removed');
            setMembers((m) => m.filter((x) => x.userId !== userId));
        } catch {
            showToast.error('Something went wrong', 'Failed to remove member');
        }
    };

    return (
        <div className="mx-auto max-w-5xl p-6">
            <PageHeader
                title="Members"
                subtitle="Manage who has access to this organisation."
                action={
                    <CanDo resource="member" action="invite">
                        <Button onClick={() => setShowInviteModal(true)}>
                            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Invite member
                        </Button>
                    </CanDo>
                }
            />

            {/* Tab bar */}
            <div className="mb-6 flex gap-1 border-b border-gray-200 dark:border-gray-700">
                {(['members', 'invites'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-2 text-sm font-medium capitalize transition ${tab === t
                            ? 'border-b-2 border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-400'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        {t}
                        {t === 'invites' && pendingInvites.length > 0 && (
                            <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-100 px-1.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                {pendingInvites.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                    <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Loading…
                </div>
            ) : tab === 'members' ? (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    {members.length === 0 ? (
                        <p className="p-6 text-center text-sm text-gray-400">No members found.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Member</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Role</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Type</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Joined</th>
                                    <CanDo resource="member" action="remove">
                                        <th className="px-4 py-3" />
                                    </CanDo>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {members.map((m) => (
                                    <tr key={m.userId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                                                    {(m.firstName?.[0] ?? m.email[0]).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {m.firstName || m.lastName ? `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() : m.email}
                                                    </p>
                                                    {(m.firstName || m.lastName) && (
                                                        <p className="text-xs text-gray-400">{m.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadge(m.role)}`}>
                                                {m.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{m.membershipType}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                                            {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : '—'}
                                        </td>
                                        <CanDo resource="member" action="remove">
                                            <td className="px-4 py-3 text-right">
                                                {m.role !== 'OWNER' && (
                                                    <button
                                                        onClick={() => handleRemoveMember(m.userId)}
                                                        className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </td>
                                        </CanDo>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            ) : (
                /* Pending invites tab */
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    {pendingInvites.length === 0 ? (
                        <p className="p-6 text-center text-sm text-gray-400">No pending invitations.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Email</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Role</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Sent</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Expires</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {pendingInvites.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{inv.email}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadge(inv.roleName)}`}>
                                                {inv.roleName}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                                            {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                                            {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleRevoke(inv.id)}
                                                className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                            >
                                                Revoke
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {showInviteModal && orgId && (
                <InviteModal
                    orgId={orgId}
                    onClose={() => setShowInviteModal(false)}
                    onInvited={load}
                />
            )}
        </div>
    );
}
