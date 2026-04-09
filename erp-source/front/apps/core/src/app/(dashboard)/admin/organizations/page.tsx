'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { showToast, filesApi } from '@erp/shell';
import { buildSearchParams } from '@erp/shared';
import PageHeader from '@/components/page-header';
import {
    DataTable,
    EmptyState,
    ListView,
    OrgAvatar,
    PageLoadingState,
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
    spinner: <svg className="h-8 w-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>,
    gear: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
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
                    <button
                        title="View organization"
                        onClick={() => router.push(`/admin/organizations/${org.id}`)}
                        className="flex items-center justify-center rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    >
                        {Icons.eye}
                    </button>
                    <button
                        title="Organization settings"
                        onClick={() => router.push(`/admin/organizations/${org.id}?tab=settings`)}
                        className="flex items-center justify-center rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    >
                        {Icons.gear}
                    </button>
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
        <div className="flex items-center gap-2">
            <ViewSwitcher view={view} onViewChange={setView} options={viewOptions} />
            <button
                onClick={() => fetchOrgs(page, searchRef.current, pendingFiltersRef.current, pendingOperatorsRef.current)}
                title="Refresh"
                className="flex items-center justify-center rounded-lg border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] p-2 text-[var(--gogo-text-secondary)] transition hover:bg-[var(--gogo-surface-hover)]"
            >
                {Icons.refresh}
            </button>
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
                subtitle={`${total} organization${total !== 1 ? 's' : ''} in system`}
                action={
                    <button
                        onClick={() => router.push('/admin/organizations/new')}
                        className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                        style={{ backgroundColor: 'var(--gogo-primary)' }}
                    >
                        {Icons.plus} New Organization
                    </button>
                }
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

            {/* Table / List */}
            {loading ? (
                <PageLoadingState message="Loading organizations..." size="lg" />
            ) : orgs.length === 0 ? (
                <EmptyState
                    title="No organizations found"
                    description={hasActiveSearch ? 'Try adjusting your search or filters' : 'No organizations exist yet'}
                />
            ) : view === 'table' ? (
                <>
                    <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] shadow-[var(--shadow-card)]">
                        <DataTable<Organization>
                            columns={orgColumns}
                            data={orgs}
                            keyExtractor={(org) => org.id}
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
                        onRowClick={(org) => router.push(`/admin/organizations/${org.id}`)}
                        title={(org) => org.name}
                        subtitle={(org) => org.slug || ''}
                        leading={(org) => <OrgAvatar name={org.name} src={orgLogoBlobUrls[org.id]} size="md" shape="rounded-lg" />}
                        trailing={(org) => (
                            <div className="flex items-center gap-1">
                                <button
                                    title="View organization"
                                    onClick={() => router.push(`/admin/organizations/${org.id}`)}
                                    className="flex items-center justify-center rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                                >
                                    {Icons.eye}
                                </button>
                                <button
                                    title="Organization settings"
                                    onClick={() => router.push(`/admin/organizations/${org.id}?tab=settings`)}
                                    className="flex items-center justify-center rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                                >
                                    {Icons.gear}
                                </button>
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
        </div>
    );
}