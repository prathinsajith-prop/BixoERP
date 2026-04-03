'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { showToast } from '@erp/shell';
import PageHeader from '@/components/page-header';

/* ── Icons ──────────────────────────────────────────────────────── */
const Icons = {
    search: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>,
    plus: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
    refresh: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>,
    eye: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    pencil: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>,
    building: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>,
    chevronLeft: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>,
    chevronRight: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>,
    spinner: <svg className="h-8 w-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>,
};

/* ── Avatar ─────────────────────────────────────────────────────── */
const ORG_COLORS = [
    'from-violet-500 to-purple-600', 'from-blue-500 to-cyan-500', 'from-emerald-500 to-teal-500',
    'from-rose-500 to-pink-500', 'from-amber-500 to-orange-500', 'from-indigo-500 to-blue-600',
    'from-fuchsia-500 to-purple-500', 'from-sky-500 to-blue-500',
];
function orgGradient(str: string) {
    let hash = 0;
    for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return ORG_COLORS[Math.abs(hash) % ORG_COLORS.length];
}
function OrgAvatar({ name }: { name: string }) {
    const initials = (name || '?').split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2);
    return (
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${orgGradient(name)} text-xs font-bold text-white`}>
            {initials}
        </div>
    );
}

/* ── Types ──────────────────────────────────────────────────────── */
interface Organization {
    id: string;
    name: string;
    slug?: string;
    description?: string;
    status?: string;
    ownerId?: string;
    createdAt?: string;
    memberCount?: number;
}

type StatusFilter = 'all' | 'ACTIVE' | 'INACTIVE';

/* ── Status Badge ───────────────────────────────────────────────── */
function StatusBadge({ status }: { status?: string }) {
    const s = (status || 'ACTIVE').toUpperCase();
    const cls = s === 'ACTIVE'
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400';
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>{s.charAt(0) + s.slice(1).toLowerCase()}</span>;
}

const PAGE_SIZES = [10, 25, 50];

export default function AdminOrganizationsPage() {
    const router = useRouter();
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    const fetchOrgs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authApi.listOrganizations({ page, limit: pageSize });
            const raw = res.data?.data ?? res.data ?? {};
            const list: Organization[] = raw.organizations ?? raw.data ?? (Array.isArray(raw) ? raw : []);
            setOrgs(list);
            setTotal(raw.total ?? list.length);
        } catch {
            showToast.error('Load failed', 'Could not fetch organizations.');
            setOrgs([]);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize]);

    useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

    const filtered = useMemo(() => {
        let list = orgs;
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter((o) =>
                o.name?.toLowerCase().includes(q) ||
                o.slug?.toLowerCase().includes(q) ||
                o.description?.toLowerCase().includes(q),
            );
        }
        if (statusFilter !== 'all') {
            list = list.filter((o) => (o.status || 'ACTIVE').toUpperCase() === statusFilter);
        }
        return list;
    }, [orgs, search, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <PageHeader
                    title="Organizations"
                    subtitle={`${total} organization${total !== 1 ? 's' : ''} in system`}
                    action={
                        <button
                            onClick={() => router.push('/admin/organizations/new')}
                            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                        >
                            {Icons.plus} New Organization
                        </button>
                    }
                />

                {/* Toolbar */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Search */}
                        <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">{Icons.search}</span>
                            <input
                                type="search"
                                placeholder="Search organizations…"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="w-64 rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm placeholder-gray-400 shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                            />
                        </div>
                        {/* Status filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }}
                            className="rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="all">All statuses</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Page size */}
                        <select
                            value={pageSize}
                            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                            className="rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm shadow-sm outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} / page</option>)}
                        </select>
                        {/* Refresh */}
                        <button
                            onClick={fetchOrgs}
                            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 shadow-sm transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                        >
                            {Icons.refresh}
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                    {loading ? (
                        <div className="flex items-center justify-center py-24">{Icons.spinner}</div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-24 text-gray-400">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">{Icons.building}</div>
                            <p className="text-sm">{search || statusFilter !== 'all' ? 'No organizations match the filters.' : 'No organizations found.'}</p>
                        </div>
                    ) : (
                        <table className="w-full min-w-[600px] text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                                    <th className="py-3 pl-5 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Organization</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Slug</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Created</th>
                                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 pr-5">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                                {filtered.map((org) => (
                                    <tr
                                        key={org.id}
                                        className="group cursor-pointer transition hover:bg-blue-50/40 dark:hover:bg-gray-800/40"
                                        onClick={() => router.push(`/admin/organizations/${org.id}`)}
                                    >
                                        <td className="py-3.5 pl-5 pr-3">
                                            <div className="flex items-center gap-3">
                                                <OrgAvatar name={org.name} />
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium text-gray-900 dark:text-white">{org.name}</p>
                                                    {org.description && (
                                                        <p className="truncate max-w-xs text-xs text-gray-400 dark:text-gray-500">{org.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3.5">
                                            <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{org.slug || '—'}</span>
                                        </td>
                                        <td className="px-3 py-3.5">
                                            <StatusBadge status={org.status} />
                                        </td>
                                        <td className="px-3 py-3.5 text-xs text-gray-500 dark:text-gray-400">
                                            {org.createdAt ? new Date(org.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                                        </td>
                                        <td className="py-3.5 pl-3 pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    title="View organization"
                                                    onClick={() => router.push(`/admin/organizations/${org.id}`)}
                                                    className="flex items-center justify-center rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                                                >
                                                    {Icons.eye}
                                                </button>
                                                <button
                                                    title="Edit organization"
                                                    onClick={() => router.push(`/admin/organizations/${org.id}?tab=settings`)}
                                                    className="flex items-center justify-center rounded-md p-1.5 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600 dark:text-gray-500 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
                                                >
                                                    {Icons.pencil}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {/* Pagination footer */}
                    {!loading && filtered.length > 0 && (
                        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 dark:border-gray-700">
                            <p className="text-xs text-gray-400">
                                {filtered.length < total
                                    ? `Showing ${filtered.length} of ${total} (filtered)`
                                    : `${total} organization${total !== 1 ? 's' : ''} total`}
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-700"
                                >
                                    {Icons.chevronLeft}
                                </button>
                                <span className="px-2 text-xs text-gray-500 dark:text-gray-400">Page {page} / {totalPages}</span>
                                <button
                                    disabled={page >= totalPages}
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-700"
                                >
                                    {Icons.chevronRight}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
