'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { showToast, filesApi } from '@erp/shell';
import { buildSearchParams } from '@erp/shared';
import {
    ActionButtons,
    Button,
    ConfirmDialog,
    DataTable,
    EmptyState,
    ListView,
    OrgAvatar,
    PageHeader,
    PageLoadingState,
    TablePageSkeleton,
    Pagination,
    SearchFilter,
    Stats,
    StatusBadge,
    ViewSwitcher,
    type ActiveFilters,
    type ActiveOperators,
    type FilterConfig,
    type TableColumn,
    type ViewMode,
} from '@erp/ui';

/* ── Icons ──────────────────────────────────────────────────────── */
const Icons = {
    search: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>,
    plus: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
    refresh: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>,
    eye: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    pencil: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>,
    building: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>,
    buildingLg: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>,
    checkCircle: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    xCircle: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    spinner: <svg className="h-8 w-8 animate-spin text-[var(--gogo-primary)]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>,
    gear: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    dots: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>,
    download: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>,
    trash: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>,
    orgToggle: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>,
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
    logoUrl?: string;
}

interface OrgStats { total: number; active: number; inactive: number; }

const PAGE_SIZES = [10, 25, 50];

/* ── Row action dropdown ────────────────────────────────────────── */
function OrgRowActions({ org, onView, onEdit, onToggleStatus, onDelete }: {
    org: Organization; onView: () => void; onEdit: () => void; onToggleStatus: () => void; onDelete: () => void;
}) {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [coords, setCoords] = useState({ top: 0, right: 0 });

    useEffect(() => {
        if (!open || !triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({ top: rect.bottom + window.scrollY + 4, right: window.innerWidth - rect.right });
    }, [open]);

    useEffect(() => {
        const handle = (e: MouseEvent) => {
            const target = e.target as Node;
            if (triggerRef.current && !triggerRef.current.contains(target)) {
                const portal = document.getElementById('org-row-action-portal');
                if (!portal || !portal.contains(target)) setOpen(false);
            }
        };
        if (open) document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, [open]);

    const isActive = (org.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE';
    const items = [
        { label: 'View organization', icon: Icons.eye, onClick: onView },
        { label: 'Edit settings', icon: Icons.gear, onClick: onEdit },
        { label: isActive ? 'Deactivate' : 'Activate', icon: Icons.orgToggle, onClick: onToggleStatus, danger: isActive },
        { label: 'Delete organization', icon: Icons.trash, onClick: onDelete, danger: true },
    ];

    const dropdown = open ? createPortal(
        <div
            id="org-row-action-portal"
            className="fixed z-[9999] w-48 rounded-xl bg-white py-1 shadow-lg ring-1 ring-gray-200/60 dark:bg-gray-900 dark:ring-gray-700"
            style={{ top: coords.top, right: coords.right }}
        >
            {items.map((item) => (
                <button key={item.label} onClick={() => { setOpen(false); item.onClick(); }}
                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800 ${item.danger ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {item.icon}
                    {item.label}
                </button>
            ))}
        </div>,
        document.body
    ) : null;

    return (
        <div>
            <button ref={triggerRef} onClick={() => setOpen(!open)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300">
                {Icons.dots}
            </button>
            {dropdown}
        </div>
    );
}

export default function AdminOrganizationsPage() {
    const router = useRouter();
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [orgStats, setOrgStats] = useState<OrgStats>({ total: 0, active: 0, inactive: 0 });
    const [page, setPage] = useState(1);
    const [pageSize] = useState(25);
    const [search, setSearch] = useState('');
    const [appliedFilters, setAppliedFilters] = useState<ActiveFilters>({});
    const [activeOperators, setActiveOperators] = useState<ActiveOperators>({});
    const [orgLogoBlobUrls, setOrgLogoBlobUrls] = useState<Record<string, string>>({});
    const [view, setView] = useState<ViewMode>('table');

    /* ── Selection ─── */
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    /* ── Modals ─── */
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [toggleModalOpen, setToggleModalOpen] = useState(false);
    const [toggling, setToggling] = useState(false);

    const pendingFiltersRef = useRef<ActiveFilters>({});
    const pendingOperatorsRef = useRef<ActiveOperators>({});
    const searchRef = useRef('');

    const fetchOrgs = useCallback(async (targetPage: number, currentSearch: string, currentFilters: ActiveFilters, currentOperators: ActiveOperators) => {
        setLoading(true);
        try {
            const params = buildSearchParams(currentSearch, currentFilters, currentOperators, { page: targetPage, limit: pageSize });
            const res = await authApi.listOrganizations(params);
            const raw = res.data?.data ?? res.data ?? {};
            const list: Organization[] = raw.organizations ?? raw.data ?? (Array.isArray(raw) ? raw : []);
            setOrgs(list);
            setTotal(raw.total ?? list.length);
            // Prefer server-side summary (unfiltered totals); fall back to deriving from the current page
            if (raw.summary) {
                setOrgStats({
                    total: raw.summary.total ?? raw.total ?? list.length,
                    active: raw.summary.active ?? 0,
                    inactive: raw.summary.inactive ?? 0,
                });
            } else {
                setOrgStats({
                    total: raw.total ?? list.length,
                    active: list.filter((o) => (o.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE').length,
                    inactive: list.filter((o) => (o.status ?? 'ACTIVE').toUpperCase() !== 'ACTIVE').length,
                });
            }
        } catch {
            showToast.error('Load failed', 'Could not fetch organizations.');
            setOrgs([]);
        } finally {
            setLoading(false);
        }
    }, [pageSize]);

    useEffect(() => {
        fetchOrgs(1, '', {}, {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        orgs.forEach((org) => {
            if (!org.logoUrl) return;
            const match = org.logoUrl.match(/\/files\/([0-9a-f-]+)\/download/);
            if (!match) { setOrgLogoBlobUrls((prev) => ({ ...prev, [org.id]: org.logoUrl! })); return; }
            filesApi.download(match[1], org.id).then((url) => {
                if (url) setOrgLogoBlobUrls((prev) => ({ ...prev, [org.id]: url }));
            }).catch(() => { });
        });
    }, [orgs]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const hasActiveSearch = !!(search || Object.keys(appliedFilters).some((k) => {
        const v = appliedFilters[k]; return Array.isArray(v) ? v.length > 0 : Boolean(v);
    }));

    /* ── Filter handlers ───────────────────────────────────────────── */
    const handleSearchChange = useCallback((value: string) => { searchRef.current = value; setSearch(value); }, []);

    const handleToolbarFilterStateChange = useCallback((key: string, state: { value: string | string[]; operator: string }) => {
        pendingFiltersRef.current = { ...pendingFiltersRef.current, [key]: state.value };
        pendingOperatorsRef.current = { ...pendingOperatorsRef.current, [key]: state.operator };
        setAppliedFilters((prev) => ({ ...prev, [key]: state.value }));
        setActiveOperators((prev) => ({ ...prev, [key]: state.operator }));
    }, []);

    const handleToolbarFilterChange = useCallback((key: string, value: string | string[]) => {
        pendingFiltersRef.current = { ...pendingFiltersRef.current, [key]: value };
        setAppliedFilters((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleToolbarFilterClear = useCallback((key: string) => {
        const newFilters = { ...pendingFiltersRef.current };
        const newOps = { ...pendingOperatorsRef.current };
        delete newFilters[key]; delete newOps[key];
        pendingFiltersRef.current = newFilters; pendingOperatorsRef.current = newOps;
        setAppliedFilters(newFilters); setActiveOperators(newOps);
        setPage(1);
        fetchOrgs(1, searchRef.current, newFilters, newOps);
    }, [fetchOrgs]);

    const clearFilters = useCallback(() => {
        pendingFiltersRef.current = {}; pendingOperatorsRef.current = {}; searchRef.current = '';
        setAppliedFilters({}); setActiveOperators({}); setSearch(''); setPage(1);
        fetchOrgs(1, '', {}, {});
    }, [fetchOrgs]);

    const handleSearch = useCallback(() => {
        setPage(1);
        fetchOrgs(1, searchRef.current, pendingFiltersRef.current, pendingOperatorsRef.current);
    }, [fetchOrgs]);

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage);
        fetchOrgs(newPage, searchRef.current, pendingFiltersRef.current, pendingOperatorsRef.current);
    }, [fetchOrgs]);

    /* ── Delete organization ─── */
    const handleDeleteOrg = useCallback(async () => {
        if (!selectedOrg) return;
        setDeleting(true);
        const name = selectedOrg.name;
        try {
            await authApi.deleteOrganization(selectedOrg.id);
            setOrgs((prev) => prev.filter((o) => o.id !== selectedOrg.id));
            setDeleteModalOpen(false);
            setSelectedOrg(null);
            showToast.success(`Organization "${name}" deleted successfully.`);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete organization.';
            showToast.error('Something went wrong', msg);
            setDeleteModalOpen(false);
            setSelectedOrg(null);
        } finally { setDeleting(false); }
    }, [selectedOrg]);

    /* ── Toggle active/inactive ─── */
    const confirmToggleOrg = useCallback(async () => {
        if (!selectedOrg) return;
        setToggling(true);
        const isActive = (selectedOrg.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE';
        try {
            await authApi.updateOrganization(selectedOrg.id, { status: isActive ? 'INACTIVE' : 'ACTIVE' });
            setOrgs((prev) => prev.map((o) =>
                o.id === selectedOrg.id ? { ...o, status: isActive ? 'INACTIVE' : 'ACTIVE' } : o
            ));
            setToggleModalOpen(false);
            setSelectedOrg(null);
            showToast.success(`Organization "${selectedOrg.name}" ${isActive ? 'deactivated' : 'activated'} successfully.`);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update organization.';
            showToast.error('Something went wrong', msg);
            setToggleModalOpen(false);
            setSelectedOrg(null);
        } finally { setToggling(false); }
    }, [selectedOrg]);

    /* ── Export CSV ─── */
    const handleExport = useCallback(() => {
        const header = 'Name,Slug,Status,Created\n';
        const rows = orgs.map((o) => {
            const status = (o.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'Active' : 'Inactive';
            const created = o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '';
            return `"${o.name}","${o.slug ?? ''}","${status}","${created}"`;
        }).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'organizations.csv'; a.click();
        URL.revokeObjectURL(url);
    }, [orgs]);

    /* ── Selection helpers ─── */
    const selectedKeys = useMemo(() => Array.from(selectedIds), [selectedIds]);
    const someSelected = selectedIds.size > 0;

    const filterConfigs = useMemo<FilterConfig[]>(() => [
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
            ],
            quickOptions: [
                { value: 'active', label: 'Active only' },
                { value: 'inactive', label: 'Inactive only' },
            ],
            placeholder: 'Filter by status',
        },
        {
            key: 'name',
            label: 'Name',
            type: 'text',
            placeholder: 'Search by name',
        },
        {
            key: 'slug',
            label: 'Slug',
            type: 'text',
            placeholder: 'Search by slug',
        },
    ], []);

    const orgColumns: TableColumn<Organization>[] = [
        {
            key: 'name',
            header: 'Organization',
            render: (org) => (
                <div className="flex items-center gap-3">
                    <OrgAvatar name={org.name} src={orgLogoBlobUrls[org.id]} size="md" shape="rounded-lg" />
                    <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900 dark:text-white">{org.name}</p>
                        {org.description && (
                            <p className="truncate max-w-xs text-xs text-gray-400 dark:text-gray-500">{org.description}</p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'slug',
            header: 'Slug',
            render: (org) => <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{org.slug || '—'}</span>,
        },
        {
            key: 'status',
            header: 'Status',
            render: (org) => <StatusBadge status={org.status ?? 'ACTIVE'} />,
        },
        {
            key: 'createdAt',
            header: 'Created',
            render: (org) => (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {org.createdAt ? new Date(org.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                </span>
            ),
        },
        {
            key: 'actions',
            header: '',
            align: 'right' as const,
            render: (org) => (
                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <OrgRowActions
                        org={org}
                        onView={() => router.push(`/admin/organizations/${org.id}`)}
                        onEdit={() => router.push(`/admin/organizations/${org.id}?tab=settings`)}
                        onToggleStatus={() => { setSelectedOrg(org); setToggleModalOpen(true); }}
                        onDelete={() => { setSelectedOrg(org); setDeleteModalOpen(true); }}
                    />
                </div>
            ),
        },
    ];

    const viewOptions = useMemo(
        () => [
            {
                value: 'table' as ViewMode,
                label: 'Table view',
                icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0c0 .621.504 1.125 1.125 1.125h1.5c.621 0 1.125-.504 1.125-1.125m0 0V5.625" /></svg>,
            },
            {
                value: 'list' as ViewMode,
                label: 'List view',
                icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>,
            },
        ],
        []
    );

    const toolbarActions = (
        <div className="flex flex-wrap items-center gap-2">
            <ViewSwitcher view={view} onViewChange={setView} options={viewOptions} />
            <ActionButtons
                actions={[
                    {
                        key: 'refresh-orgs',
                        label: 'Refresh',
                        icon: Icons.refresh,
                        variant: 'outline',
                        onClick: () => fetchOrgs(page, searchRef.current, pendingFiltersRef.current, pendingOperatorsRef.current),
                    },
                    {
                        key: 'export-orgs',
                        label: 'Export CSV',
                        icon: Icons.download,
                        variant: 'outline',
                        onClick: handleExport,
                    },
                    {
                        key: 'create-org',
                        label: 'New Organization',
                        icon: Icons.plus,
                        onClick: () => router.push('/admin/organizations/new'),
                    },
                ]}
            />
        </div>
    );

    const listColumns: TableColumn<Organization>[] = [
        {
            key: 'slug',
            header: 'Slug',
            render: (org) => <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{org.slug || '—'}</span>,
        },
        {
            key: 'status',
            header: 'Status',
            render: (org) => <StatusBadge status={org.status ?? 'ACTIVE'} />,
        },
        {
            key: 'createdAt',
            header: 'Created',
            render: (org) => org.createdAt ? new Date(org.createdAt).toLocaleDateString() : '—',
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Organizations"
                description={`${total} organization${total !== 1 ? 's' : ''} in system`}
            />

            {/* Stats */}
            <Stats
                columns={3}
                metrics={[
                    { label: 'Total Organizations', value: orgStats.total, icon: Icons.buildingLg, color: 'info' },
                    { label: 'Active', value: orgStats.active, icon: Icons.checkCircle, color: 'success' },
                    { label: 'Inactive', value: orgStats.inactive, icon: Icons.xCircle, color: 'error' },
                ]}
            />

            {/* Search + Filters */}
            <SearchFilter
                searchPlaceholder="Search organizations by name or slug"
                searchValue={search}
                onSearchChange={handleSearchChange}
                filters={filterConfigs}
                activeFilters={appliedFilters}
                activeOperators={activeOperators}
                onFilterChange={handleToolbarFilterChange}
                onFilterStateChange={handleToolbarFilterStateChange}
                onFilterClear={handleToolbarFilterClear}
                onFilterClearAll={clearFilters}
                onSearch={handleSearch}
                storageKey="erp.organizations.searchHistory"
                actions={toolbarActions}
            />

            {hasActiveSearch && (
                <p className="text-xs text-[var(--gogo-text-secondary)]">
                    Showing <strong>{total}</strong> result{total !== 1 ? 's' : ''}
                </p>
            )}

            {/* Bulk selection bar */}
            {someSelected && (
                <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] px-4 py-2.5 shadow-[var(--shadow-card)]">
                    <span className="text-sm font-medium text-[var(--gogo-primary)]">{selectedIds.size} selected</span>
                    <div className="h-4 w-px bg-[var(--gogo-divider)]" />
                    <button onClick={() => setSelectedIds(new Set())} className="text-sm font-medium text-[var(--gogo-primary)] transition hover:opacity-80">
                        Deselect all
                    </button>
                </div>
            )}

            {/* Table / List */}
            {loading ? (
                <TablePageSkeleton />
            ) : orgs.length === 0 ? (
                <EmptyState
                    title="No organizations found"
                    description={hasActiveSearch ? 'Try adjusting your search or filters' : 'No organizations exist yet'}
                    action={!hasActiveSearch ? (
                        <Button size="sm" onClick={() => router.push('/admin/organizations/new')}>
                            {Icons.plus} New Organization
                        </Button>
                    ) : undefined}
                />
            ) : view === 'table' ? (
                <>
                    <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] shadow-[var(--shadow-card)]">
                        <DataTable<Organization>
                            columns={orgColumns}
                            data={orgs}
                            keyExtractor={(org) => org.id}
                            selectable
                            selectedKeys={selectedKeys}
                            onSelectionChange={(keys) => setSelectedIds(new Set(keys))}
                            onRowClick={(org) => router.push(`/admin/organizations/${org.id}`)}
                        />
                    </div>
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        totalItems={total}
                        pageSize={pageSize}
                        pageSizeOptions={PAGE_SIZES}
                        onPageChange={handlePageChange}
                        onPageSizeChange={() => { }}
                    />
                </>
            ) : (
                <div className="space-y-4">
                    <ListView
                        columns={listColumns}
                        data={orgs}
                        keyExtractor={(org) => org.id}
                        selectable
                        selectedKeys={selectedKeys}
                        onSelectionChange={(keys) => setSelectedIds(new Set(keys))}
                        onRowClick={(org) => router.push(`/admin/organizations/${org.id}`)}
                        title={(org) => org.name}
                        subtitle={(org) => org.slug || ''}
                        leading={(org) => <OrgAvatar name={org.name} src={orgLogoBlobUrls[org.id]} size="md" shape="rounded-lg" />}
                        trailing={(org) => (
                            <div className="flex items-center gap-1">
                                <OrgRowActions
                                    org={org}
                                    onView={() => router.push(`/admin/organizations/${org.id}`)}
                                    onEdit={() => router.push(`/admin/organizations/${org.id}?tab=settings`)}
                                    onToggleStatus={() => { setSelectedOrg(org); setToggleModalOpen(true); }}
                                    onDelete={() => { setSelectedOrg(org); setDeleteModalOpen(true); }}
                                />
                            </div>
                        )}
                        emptyMessage={hasActiveSearch ? 'No organizations match your filters' : 'No organizations found'}
                    />
                    <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] shadow-[var(--shadow-card)]">
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            totalItems={total}
                            pageSize={pageSize}
                            pageSizeOptions={PAGE_SIZES}
                            onPageChange={handlePageChange}
                            onPageSizeChange={() => { }}
                        />
                    </div>
                </div>
            )}

            {/* ── Delete confirmation ─── */}
            <ConfirmDialog
                open={deleteModalOpen && !!selectedOrg}
                onClose={() => { setDeleteModalOpen(false); setSelectedOrg(null); }}
                onConfirm={handleDeleteOrg}
                variant="danger"
                title="Delete Organization"
                message={selectedOrg ? <>Are you sure you want to delete <strong>{selectedOrg.name}</strong>? This action cannot be undone.</> : ''}
                confirmLabel="Delete"
                loading={deleting}
            />

            {/* ── Toggle active/inactive confirmation ─── */}
            <ConfirmDialog
                open={toggleModalOpen && !!selectedOrg}
                onClose={() => { setToggleModalOpen(false); setSelectedOrg(null); }}
                onConfirm={confirmToggleOrg}
                variant={(selectedOrg?.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'warning' : 'success'}
                title={(selectedOrg?.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'Deactivate Organization' : 'Activate Organization'}
                message={selectedOrg ? (
                    (selectedOrg.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE'
                        ? <>Are you sure you want to deactivate <strong>{selectedOrg.name}</strong>?</>
                        : <>Are you sure you want to activate <strong>{selectedOrg.name}</strong>?</>
                ) : ''}
                confirmLabel={(selectedOrg?.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                loading={toggling}
            />
        </div>
    );
}