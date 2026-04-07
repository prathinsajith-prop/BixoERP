'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { showToast } from '@erp/shell';
import PageHeader from '@/components/page-header';
import { DataTable, StatusBadge, Tabs, type TableColumn } from '@erp/ui';

/* ── Icons ──────────────────────────────────────────────────────── */
const Icons = {
    back: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>,
    pencil: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>,
    check: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>,
    x: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
    plus: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
    trash: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>,
    spinner: <svg className="h-7 w-7 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>,
    spinnerSm: <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>,
    user: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>,
    copy: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>,
};

/* ── Types ──────────────────────────────────────────────────────── */
interface Organization {
    id: string;
    name: string;
    slug?: string;
    description?: string;
    status?: string;
    ownerId?: string;
    createdAt?: string;
    updatedAt?: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
}

interface Member {
    userId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    membershipType?: string;
    joinedAt?: string;
    employeeId?: string | null;
}

type TabKey = 'overview' | 'members' | 'settings';

/* ── Role Badge ─────────────────────────────────────────────────── */
const ROLE_COLOURS: Record<string, string> = {
    OWNER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    ADMIN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    MANAGER: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    MEMBER: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};
function RoleBadge({ role }: { role: string }) {
    const key = role?.toUpperCase();
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${ROLE_COLOURS[key] ?? ROLE_COLOURS['MEMBER']}`}>{role}</span>;
}



/* ── Avatar ─────────────────────────────────────────────────────── */
const ORG_COLORS = [
    'from-violet-500 to-purple-600', 'from-blue-500 to-cyan-500', 'from-emerald-500 to-teal-500',
    'from-rose-500 to-pink-500', 'from-amber-500 to-orange-500', 'from-indigo-500 to-blue-600',
];
function orgGradient(str: string) {
    let hash = 0;
    for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return ORG_COLORS[Math.abs(hash) % ORG_COLORS.length];
}
function OrgAvatar({ name, size = 14 }: { name: string; size?: number }) {
    const initials = (name || '?').split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2);
    const sz = `h-${size} w-${size}`;
    return (
        <div className={`flex ${sz} shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${orgGradient(name)} text-lg font-bold text-white`}>
            {initials}
        </div>
    );
}
function MemberAvatar({ name, email }: { name: string; email: string }) {
    const initials = name?.trim()
        ? name.split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2)
        : (email || '?').substring(0, 2).toUpperCase();
    return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-[11px] font-bold text-white">
            {initials}
        </div>
    );
}

/* ── Inline editable field ──────────────────────────────────────── */
function EditableField({
    label, value, onSave, multiline = false, hint,
}: {
    label: string; value: string; onSave: (v: string) => Promise<void>; multiline?: boolean; hint?: string;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(draft);
            setEditing(false);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => { setDraft(value); setEditing(false); };

    return (
        <div>
            <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</label>
                {!editing && (
                    <button onClick={() => { setDraft(value); setEditing(true); }} className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-gray-400 transition hover:text-blue-600 dark:hover:text-blue-400">
                        {Icons.pencil} Edit
                    </button>
                )}
            </div>
            {editing ? (
                <div className="space-y-2">
                    {multiline ? (
                        <textarea
                            rows={3}
                            autoFocus
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            className="w-full rounded-lg border border-blue-400 px-3 py-2 text-sm text-gray-900 outline-none ring-2 ring-blue-100 focus:ring-blue-300 dark:border-blue-500 dark:bg-gray-800 dark:text-white dark:ring-blue-900/50"
                        />
                    ) : (
                        <input
                            autoFocus
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            className="w-full rounded-lg border border-blue-400 px-3 py-2 text-sm text-gray-900 outline-none ring-2 ring-blue-100 focus:ring-blue-300 dark:border-blue-500 dark:bg-gray-800 dark:text-white dark:ring-blue-900/50"
                        />
                    )}
                    <div className="flex gap-2">
                        <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-50">
                            {saving ? Icons.spinnerSm : Icons.check} Save
                        </button>
                        <button onClick={handleCancel} disabled={saving} className="flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
                            {Icons.x} Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-gray-900 dark:text-white">{value || <span className="text-gray-400 dark:text-gray-500">—</span>}</p>
            )}
            {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
        </div>
    );
}

/* ── Invite Modal ───────────────────────────────────────────────── */
function InviteModal({ orgId, onClose, onInvited }: { orgId: string; onClose: () => void; onInvited: () => void }) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('MEMBER');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        setLoading(true);
        try {
            await authApi.inviteMember({ organisationId: orgId, email: email.trim(), roleName: role });
            showToast.success('Invitation sent', `Invite sent to ${email.trim()}.`);
            onInvited();
            onClose();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            showToast.error('Invite failed', msg || 'Could not send invitation.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
                <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Invite member</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
                        <input
                            type="email" required autoFocus
                            value={email} onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                        <select value={role} onChange={(e) => setRole(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                            <option value="MEMBER">Member</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                    <div className="flex gap-2 pt-1">
                        <button type="submit" disabled={loading || !email.trim()}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
                            {loading ? Icons.spinnerSm : Icons.plus} Send invite
                        </button>
                        <button type="button" onClick={onClose}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ── Main Page ──────────────────────────────────────────────────── */
export default function OrganizationDetailPage() {
    const { orgId } = useParams<{ orgId: string }>();
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab') as TabKey | null;

    const [activeTab, setActiveTab] = useState<TabKey>(
        tabParam === 'members' || tabParam === 'settings' ? tabParam : 'overview',
    );
    const [org, setOrg] = useState<Organization | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [loadingOrg, setLoadingOrg] = useState(true);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [showInvite, setShowInvite] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [togglingStatus, setTogglingStatus] = useState(false);

    const handleToggleOrgStatus = async () => {
        if (!org) return;
        const isActive = (org.status || 'ACTIVE').toUpperCase() === 'ACTIVE';
        const newStatus = isActive ? 'INACTIVE' : 'ACTIVE';
        if (!confirm(`${isActive ? 'Deactivate' : 'Activate'} organization "${org.name}"?`)) return;
        setTogglingStatus(true);
        try {
            await authApi.updateOrganization(orgId, { status: newStatus });
            setOrg({ ...org, status: newStatus });
            showToast.success(isActive ? 'Organization deactivated' : 'Organization activated');
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            showToast.error('Update failed', msg || 'Could not update status.');
        } finally {
            setTogglingStatus(false);
        }
    };

    const fetchOrg = useCallback(async () => {
        setLoadingOrg(true);
        try {
            const res = await authApi.getOrganization(orgId);
            setOrg(res.data?.data ?? res.data ?? null);
        } catch {
            showToast.error('Load failed', 'Could not fetch organization details.');
        } finally {
            setLoadingOrg(false);
        }
    }, [orgId]);

    const fetchMembers = useCallback(async () => {
        setLoadingMembers(true);
        try {
            const res = await authApi.listOrganizationMembers(orgId);
            const raw = res.data?.data ?? res.data ?? [];
            setMembers(Array.isArray(raw) ? raw : raw.members ?? []);
        } catch {
            setMembers([]);
        } finally {
            setLoadingMembers(false);
        }
    }, [orgId]);

    useEffect(() => { fetchOrg(); }, [fetchOrg]);
    useEffect(() => { if (activeTab === 'members') fetchMembers(); }, [activeTab, fetchMembers]);

    const handleFieldSave = async (field: keyof Pick<Organization, 'name' | 'slug' | 'description'>, value: string) => {
        if (!org) return;
        try {
            await authApi.updateOrganization(orgId, { [field]: value });
            setOrg({ ...org, [field]: value });
            showToast.success('Saved', `${field.charAt(0).toUpperCase() + field.slice(1)} updated.`);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            showToast.error('Save failed', msg || 'Could not update organization.');
            throw err;
        }
    };

    const handleRemoveMember = async (userId: string, email: string) => {
        if (!confirm(`Remove ${email} from this organization?`)) return;
        setRemovingId(userId);
        try {
            await authApi.removeMemberFromOrganization(orgId, userId);
            setMembers((prev) => prev.filter((m) => m.userId !== userId));
            showToast.success('Member removed', `${email} has been removed.`);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            showToast.error('Remove failed', msg || 'Could not remove member.');
        } finally {
            setRemovingId(null);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await authApi.updateMemberRole(orgId, userId, { role: newRole });
            setMembers((prev) => prev.map((m) => m.userId === userId ? { ...m, role: newRole } : m));
            showToast.success('Role updated', 'Member role changed.');
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            showToast.error('Update failed', msg || 'Could not update role.');
        }
    };

    const TABS: { key: TabKey; label: string }[] = [
        { key: 'overview', label: 'Overview' },
        { key: 'members', label: `Members${members.length > 0 ? ` (${members.length})` : ''}` },
        { key: 'settings', label: 'Settings' },
    ];

    if (loadingOrg) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
                {Icons.spinner}
            </div>
        );
    }

    if (!org) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-950">
                <p className="text-sm text-gray-500">Organization not found.</p>
                <button onClick={() => router.push('/admin/organizations')}
                    className="text-sm text-blue-600 underline">← Back to organizations</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {showInvite && (
                <InviteModal orgId={orgId} onClose={() => setShowInvite(false)} onInvited={fetchMembers} />
            )}

            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Back */}
                <button
                    onClick={() => router.push('/admin/organizations')}
                    className="mb-6 flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                    {Icons.back} Organizations
                </button>

                {/* Header */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <OrgAvatar name={org.name} />
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{org.name}</h1>
                                <StatusBadge status={org.status ?? 'active'} />
                            </div>
                            {org.slug && (
                                <p className="mt-0.5 font-mono text-xs text-gray-400 dark:text-gray-500">/{org.slug}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            onClick={() => { setActiveTab('members'); setShowInvite(true); }}
                            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                        >
                            {Icons.plus} Invite member
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                        >
                            {Icons.pencil} Edit
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs
                    tabs={TABS}
                    activeKey={activeTab}
                    onChange={(key) => setActiveTab(key as TabKey)}
                    variant="line"
                    className="mb-6"
                />

                {/* ── Overview ──────────────────────────────────────────── */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Main info */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
                                <h3 className="mb-5 text-base font-semibold text-gray-900 dark:text-white">Organization details</h3>
                                <div className="space-y-5">
                                    <EditableField
                                        label="Name"
                                        value={org.name}
                                        onSave={(v) => handleFieldSave('name', v)}
                                        hint="The display name for this organization (2–200 characters)"
                                    />
                                    <EditableField
                                        label="Slug"
                                        value={org.slug ?? ''}
                                        onSave={(v) => handleFieldSave('slug', v)}
                                        hint="Unique URL-friendly identifier. Lowercase letters, numbers and hyphens only (e.g. acme-corp)"
                                    />
                                    <EditableField
                                        label="Description"
                                        value={org.description ?? ''}
                                        onSave={(v) => handleFieldSave('description', v)}
                                        multiline
                                        hint="Brief description of the organization, shown in listings (max 500 characters)"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Side info */}
                        <div className="space-y-4">
                            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
                                <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Information</h3>
                                <dl className="space-y-4 text-sm">
                                    <div>
                                        <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">Status</dt>
                                        <dd className="mt-1"><StatusBadge status={org.status ?? 'active'} /></dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">Organization ID</dt>
                                        <dd className="mt-1 flex items-center gap-1.5">
                                            <code className="truncate rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600 dark:bg-gray-800 dark:text-gray-300">{org.id}</code>
                                            <button onClick={() => { navigator.clipboard.writeText(org.id); showToast.success('Copied', 'ID copied to clipboard.'); }} className="shrink-0 text-gray-400 hover:text-blue-600">
                                                {Icons.copy}
                                            </button>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">Created</dt>
                                        <dd className="mt-1 text-gray-700 dark:text-gray-300">
                                            {org.createdAt ? new Date(org.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                                        </dd>
                                    </div>
                                    {org.updatedAt && (
                                        <div>
                                            <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">Last Updated</dt>
                                            <dd className="mt-1 text-gray-700 dark:text-gray-300">
                                                {new Date(org.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </dd>
                                        </div>
                                    )}
                                    {org.primaryColor && (
                                        <div>
                                            <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">Brand Colour</dt>
                                            <dd className="mt-1 flex items-center gap-2">
                                                <span className="inline-block h-4 w-4 rounded-full border border-gray-200" style={{ backgroundColor: org.primaryColor }} />
                                                <span className="font-mono text-xs text-gray-600 dark:text-gray-300">{org.primaryColor}</span>
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            </div>

                            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
                                <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Quick actions</h3>
                                <div className="space-y-2">
                                    <button onClick={() => setActiveTab('members')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
                                        {Icons.user} Manage members
                                    </button>
                                    <button onClick={() => setActiveTab('settings')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
                                        {Icons.pencil} Edit settings
                                    </button>
                                    <button onClick={() => router.push('/admin/roles')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                                        Roles &amp; permissions
                                    </button>
                                    <button
                                        onClick={handleToggleOrgStatus}
                                        disabled={togglingStatus}
                                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition disabled:opacity-50 ${(org.status || 'ACTIVE').toUpperCase() === 'ACTIVE'
                                            ? 'text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20'
                                            : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20'
                                            }`}
                                    >
                                        {togglingStatus
                                            ? <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                            : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" /></svg>
                                        }
                                        {(org.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'Deactivate organization' : 'Activate organization'}
                                    </button>
                                </div>
                            </div>

                            {/* Structure links */}
                            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
                                <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Organization structure</h3>
                                <div className="space-y-2">
                                    {[
                                        { label: 'Divisions', href: '/admin/divisions', icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg> },
                                        { label: 'Departments', href: '/admin/departments', icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg> },
                                        { label: 'Teams', href: '/admin/teams', icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg> },
                                        { label: 'Roles & Permissions', href: '/admin/roles', icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg> },
                                    ].map(({ label, href, icon }) => (
                                        <button key={href} onClick={() => router.push(href)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
                                            {icon} {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Members ───────────────────────────────────────────── */}
                {activeTab === 'members' && (
                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {loadingMembers ? 'Loading…' : `${members.length} member${members.length !== 1 ? 's' : ''}`}
                            </p>
                            <button
                                onClick={() => setShowInvite(true)}
                                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                            >
                                {Icons.plus} Invite member
                            </button>
                        </div>

                        {loadingMembers ? (
                            <div className="flex items-center justify-center py-20">{Icons.spinner}</div>
                        ) : members.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white py-20 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">{Icons.user}</div>
                                <p className="text-sm text-gray-400">No members yet.</p>
                                <button onClick={() => setShowInvite(true)} className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                                    Invite the first member
                                </button>
                            </div>
                        ) : (
                            (() => {
                                const memberColumns: TableColumn<Member>[] = [
                                    {
                                        key: 'email', header: 'Member', render: (m) => {
                                            const fullName = [m.firstName, m.lastName].filter(Boolean).join(' ');
                                            return (
                                                <div className="flex items-center gap-3">
                                                    <MemberAvatar name={fullName} email={m.email} />
                                                    <div className="min-w-0">
                                                        {fullName && <p className="truncate font-medium text-gray-900 dark:text-white">{fullName}</p>}
                                                        <p className="truncate text-xs text-gray-400">{m.email}</p>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    },
                                    {
                                        key: 'employeeId', header: 'Employee ID', render: (m) => m.employeeId
                                            ? <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600 dark:bg-gray-700 dark:text-gray-300">{m.employeeId}</code>
                                            : <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                                    },
                                    {
                                        key: 'role', header: 'Role', render: (m) => (
                                            <select
                                                value={m.role}
                                                onChange={(e) => handleRoleChange(m.userId, e.target.value)}
                                                className="rounded border border-gray-200 bg-transparent py-0.5 pl-2 pr-6 text-xs font-medium text-gray-700 outline-none focus:border-blue-500 dark:border-gray-600 dark:text-gray-300"
                                            >
                                                <option value="MEMBER">Member</option>
                                                <option value="MANAGER">Manager</option>
                                                <option value="ADMIN">Admin</option>
                                                <option value="OWNER">Owner</option>
                                            </select>
                                        )
                                    },
                                    {
                                        key: 'joinedAt', header: 'Joined', render: (m) => (
                                            <span className="text-xs text-gray-400">
                                                {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                                            </span>
                                        )
                                    },
                                    {
                                        key: 'actions', header: 'Actions', align: 'right' as const, render: (m) => (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRemoveMember(m.userId, m.email); }}
                                                disabled={removingId === m.userId || m.role === 'OWNER'}
                                                title={m.role === 'OWNER' ? 'Cannot remove org owner' : 'Remove member'}
                                                className="rounded-md p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                                            >
                                                {removingId === m.userId ? Icons.spinnerSm : Icons.trash}
                                            </button>
                                        )
                                    },
                                ];
                                return <DataTable<Member> columns={memberColumns} data={members} keyExtractor={(m) => m.userId} />;
                            })()
                        )}
                    </div>
                )}

                {/* ── Settings ──────────────────────────────────────────── */}
                {activeTab === 'settings' && (
                    <SettingsTab orgId={orgId} org={org} onOrgUpdate={(updated) => setOrg({ ...org, ...updated })} />
                )}
            </div>
        </div>
    );
}

/* ── Settings Tab ───────────────────────────────────────────────── */
function SettingsTab({
    orgId, org, onOrgUpdate,
}: {
    orgId: string;
    org: Organization;
    onOrgUpdate: (updated: Partial<Organization>) => void;
}) {
    const [settings, setSettings] = useState<Record<string, unknown>>({});
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let ignore = false;
        authApi.getOrganizationSettings(orgId)
            .then((res: any) => { if (!ignore) setSettings(res.data?.data ?? res.data ?? {}); })
            .catch(() => { if (!ignore) setSettings({}); })
            .finally(() => { if (!ignore) setLoadingSettings(false); });
        return () => { ignore = true; };
    }, [orgId]);

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            await authApi.updateOrganizationSettings(orgId, settings);
            showToast.success('Settings saved', 'Organization settings have been updated.');
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            showToast.error('Save failed', msg || 'Could not save settings.');
        } finally {
            setSaving(false);
        }
    };

    const handleFieldSave = async (field: keyof Pick<Organization, 'name' | 'slug' | 'description'>, value: string) => {
        try {
            await authApi.updateOrganization(orgId, { [field]: value });
            onOrgUpdate({ [field]: value });
            showToast.success('Saved', `${field.charAt(0).toUpperCase() + field.slice(1)} updated.`);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            showToast.error('Save failed', msg || 'Could not update organization.');
            throw err;
        }
    };

    if (loadingSettings) {
        return <div className="flex items-center justify-center py-20"><svg className="h-7 w-7 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>;
    }

    function SCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
        return (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
                <div className="mb-5">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
                    {description && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
                </div>
                {children}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Organization basic info edit */}
            <SCard title="Organization Information" description="Update basic organization details">
                <div className="space-y-5">
                    <EditableField label="Name" value={org.name} onSave={(v) => handleFieldSave('name', v)} />
                    <EditableField label="Slug" value={org.slug ?? ''} onSave={(v) => handleFieldSave('slug', v)} hint="URL-friendly identifier used in links" />
                    <EditableField label="Description" value={org.description ?? ''} onSave={(v) => handleFieldSave('description', v)} multiline />
                </div>
            </SCard>

            {/* Extended settings (key-value editor for backend settings object) */}
            {Object.keys(settings).length > 0 && (
                <SCard title="Advanced Settings" description="Extended organization configuration">
                    <div className="space-y-4">
                        {Object.entries(settings).map(([key, val]) => {
                            if (typeof val === 'boolean') {
                                return (
                                    <div key={key} className="flex items-center justify-between">
                                        <label className="text-sm text-gray-700 dark:text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</label>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={val}
                                            onClick={() => setSettings((s) => ({ ...s, [key]: !val }))}
                                            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${val ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                                        >
                                            <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${val ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                );
                            }
                            if (typeof val === 'string') {
                                return (
                                    <div key={key}>
                                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</label>
                                        <input
                                            type="text"
                                            value={val}
                                            onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>
                                );
                            }
                            return null;
                        })}
                        <button
                            onClick={handleSaveSettings}
                            disabled={saving}
                            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : null}
                            Save advanced settings
                        </button>
                    </div>
                </SCard>
            )}
        </div>
    );
}
