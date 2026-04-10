'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { List, TableProperties, Building2 } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { showToast } from '@erp/shell';
import { useOrgContext } from '@/context/org';
import { buildSearchParams } from '@erp/shared';
import {
  ActionButtons,
  ConfirmDialog,
  DataTable,
  EmptyState,
  ListView,
  Modal,
  OrgAvatar,
  PageHeader,
  PageLoadingState,
  TablePageSkeleton,
  Pagination,
  SearchFilter,
  Stats,
  StatusBadge,
  Tooltip,
  ViewSwitcher,
  type ActiveFilters,
  type ActiveOperators,
  type FilterConfig,
  type TableColumn,
  type ViewMode,
} from '@erp/ui';

/* ── Types ─────────────────────────────────────────────────────── */
interface Division {
  id: string;
  name: string;
  code: string;
  description?: string;
  headUserId?: string | null;
  status: string;
  createdAt?: string;
}
interface DivisionSummary { total: number; active: number; inactive: number; }

/* ── Icons ──────────────────────────────────────────────────────── */
const RefreshIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
  </svg>
);
const PlusIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);
const TotalIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
  </svg>
);
const CheckCircleIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const XCircleIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const EditIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
  </svg>
);
const TrashIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

/* ── Zod schema (module-level) ──────────────────────────────────── */
const CODE_REGEX = /^[A-Z0-9][A-Z0-9_-]{0,48}[A-Z0-9]$|^[A-Z0-9]$/;
const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().min(1, 'Code is required').max(50)
    .transform((v) => v.trim().toUpperCase())
    .refine((v) => CODE_REGEX.test(v), 'Only uppercase letters, digits, hyphens and underscores — no spaces'),
  description: z.string().optional(),
});
type FormData = z.infer<typeof formSchema>;

/* ══════════════════════════════════════════════════════════════════
   Main component
   ══════════════════════════════════════════════════════════════════ */
export default function DivisionsPage() {
  const { orgId, isReady } = useOrgContext();

  /* ── Data ─── */
  const [items, setItems] = useState<Division[]>([]);
  const [serverTotal, setServerTotal] = useState(0);
  const [summary, setSummary] = useState<DivisionSummary>({ total: 0, active: 0, inactive: 0 });
  const [page, setPage] = useState(1);
  const limit = 20;
  const [loading, setLoading] = useState(true);

  /* ── View ─── */
  const [view, setView] = useState<ViewMode>('table');

  /* ── Filters ─── */
  const [appliedFilters, setAppliedFilters] = useState<ActiveFilters>({});
  const [activeOperators, setActiveOperators] = useState<ActiveOperators>({});
  const pendingFiltersRef = useRef<ActiveFilters>({});
  const pendingOperatorsRef = useRef<ActiveOperators>({});
  const searchRef = useRef('');

  /* ── Modals ─── */
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const editingIdRef = useRef<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Division | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<Division | null>(null);
  const [toggling, setToggling] = useState(false);

  /* ── Form ─── */
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', code: '', description: '' },
  });

  /* ── Filter configs ─── */
  const filterConfigs = useMemo<FilterConfig[]>(() => [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }],
      quickOptions: [{ value: 'active', label: 'Active only' }, { value: 'inactive', label: 'Inactive only' }],
      placeholder: 'Filter by status',
    },
    { key: 'name', label: 'Name', type: 'text', placeholder: 'Filter by name' },
    { key: 'code', label: 'Code', type: 'text', placeholder: 'Filter by code' },
  ], []);

  /* ── Fetch ─── */
  const fetchItems = useCallback(async (
    targetPage: number,
    currentSearch: string,
    currentFilters: ActiveFilters,
    currentOperators: ActiveOperators,
  ) => {
    if (!orgId) return;
    setLoading(true);
    try {
      const params = buildSearchParams(currentSearch, currentFilters, currentOperators, { page: targetPage, limit });
      const res = await authApi.listDivisions(orgId, params);
      const data = res.data?.data;
      setItems(Array.isArray(data) ? data : []);
      setServerTotal(res.data?.total ?? 0);
      if (res.data?.summary) setSummary(res.data.summary);
    } catch {
      setItems([]);
      setServerTotal(0);
    } finally {
      setLoading(false);
    }
  }, [orgId, limit]);

  useEffect(() => {
    if (orgId) fetchItems(1, '', {}, {});
  }, [orgId, fetchItems]);

  /* ── Filter handlers ─── */
  const handleSearch = useCallback(() => {
    setPage(1);
    fetchItems(1, searchRef.current, pendingFiltersRef.current, pendingOperatorsRef.current);
  }, [fetchItems]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    fetchItems(newPage, searchRef.current, pendingFiltersRef.current, pendingOperatorsRef.current);
  }, [fetchItems]);

  const handleFilterStateChange = useCallback((key: string, state: { value: string | string[]; operator: string }) => {
    pendingFiltersRef.current = { ...pendingFiltersRef.current, [key]: state.value };
    pendingOperatorsRef.current = { ...pendingOperatorsRef.current, [key]: state.operator };
    setAppliedFilters((prev) => ({ ...prev, [key]: state.value }));
    setActiveOperators((prev) => ({ ...prev, [key]: state.operator }));
  }, []);

  const handleFilterChange = useCallback((key: string, value: string | string[]) => {
    pendingFiltersRef.current = { ...pendingFiltersRef.current, [key]: value };
    setAppliedFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleFilterClear = useCallback((key: string) => {
    const newFilters = { ...pendingFiltersRef.current };
    const newOps = { ...pendingOperatorsRef.current };
    delete newFilters[key];
    delete newOps[key];
    pendingFiltersRef.current = newFilters;
    pendingOperatorsRef.current = newOps;
    setAppliedFilters(newFilters);
    setActiveOperators(newOps);
    setPage(1);
    fetchItems(1, searchRef.current, newFilters, newOps);
  }, [fetchItems]);

  const handleFilterClearAll = useCallback(() => {
    pendingFiltersRef.current = {};
    pendingOperatorsRef.current = {};
    searchRef.current = '';
    setAppliedFilters({});
    setActiveOperators({});
    setPage(1);
    fetchItems(1, '', {}, {});
  }, [fetchItems]);

  /* ── Create / edit ─── */
  const openCreate = () => {
    reset({ name: '', code: '', description: '' });
    editingIdRef.current = null;
    setFormOpen(true);
  };

  const openEdit = (item: Division) => {
    reset({ name: item.name, code: item.code, description: item.description || '' });
    editingIdRef.current = item.id;
    setFormOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    if (!orgId) return;
    setSaving(true);
    try {
      if (editingIdRef.current) {
        await authApi.updateDivision(orgId, editingIdRef.current, data);
        showToast.success('Division updated successfully.');
      } else {
        await authApi.createDivision(orgId, data);
        showToast.success('Division created successfully.');
      }
      setFormOpen(false);
      fetchItems(page, searchRef.current, pendingFiltersRef.current, pendingOperatorsRef.current);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save division.';
      showToast.error('Something went wrong', msg);
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ─── */
  const handleDelete = async () => {
    if (!orgId || !deleteTarget) return;
    setDeleting(true);
    try {
      await authApi.deleteDivision(orgId, deleteTarget.id);
      showToast.success(`Division "${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
      fetchItems(page, searchRef.current, pendingFiltersRef.current, pendingOperatorsRef.current);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete division.';
      showToast.error('Something went wrong', msg);
    } finally {
      setDeleting(false);
    }
  };

  /* ── Toggle status ─── */
  const confirmToggle = async () => {
    if (!orgId || !toggleTarget) return;
    setToggling(true);
    const isActive = toggleTarget.status === 'ACTIVE';
    try {
      await authApi.updateDivision(orgId, toggleTarget.id, { status: isActive ? 'INACTIVE' : 'ACTIVE' });
      showToast.success(`Division "${toggleTarget.name}" ${isActive ? 'deactivated' : 'activated'}.`);
      setToggleTarget(null);
      fetchItems(page, searchRef.current, pendingFiltersRef.current, pendingOperatorsRef.current);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update status.';
      showToast.error('Something went wrong', msg);
    } finally {
      setToggling(false);
    }
  };

  /* ── Derived ─── */
  const totalPages = Math.ceil(serverTotal / limit);
  const hasActiveSearch = !!(searchRef.current || Object.keys(appliedFilters).some((k) => {
    const v = appliedFilters[k];
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  }));

  const viewOptions = useMemo(() => [
    { value: 'table' as ViewMode, label: 'Table view', icon: <TableProperties className="h-4 w-4" /> },
    { value: 'list' as ViewMode, label: 'List view', icon: <List className="h-4 w-4" /> },
  ], []);

  /* ── Table columns ─── */
  const tableColumns: TableColumn<Division>[] = useMemo(() => [
    {
      key: 'name',
      header: 'Division',
      render: (item) => (
        <div className="flex items-center gap-3">
          <OrgAvatar name={item.name} size="sm" shape="rounded-lg" />
          <div>
            <p className="text-sm font-semibold text-[var(--gogo-text-primary)]">{item.name}</p>
            <p className="font-mono text-xs text-[var(--gogo-text-secondary)]">{item.code}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      headerClassName: 'hidden md:table-cell',
      className: 'hidden md:table-cell',
      render: (item) => (
        <span className="text-sm text-[var(--gogo-text-secondary)]">{item.description || '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'createdAt',
      header: 'Created',
      headerClassName: 'hidden lg:table-cell',
      className: 'hidden lg:table-cell',
      render: (item) => (
        <span className="text-sm text-[var(--gogo-text-secondary)]">
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right' as const,
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <Tooltip content="Edit">
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(item); }}
            className="rounded-lg p-1.5 text-[var(--gogo-text-secondary)] transition hover:bg-[var(--gogo-grey-100)] hover:text-[var(--gogo-text-primary)]"
          >
            <EditIcon />
          </button>
          </Tooltip>
          <Tooltip content={item.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
          <button
            onClick={(e) => { e.stopPropagation(); setToggleTarget(item); }}
            className="rounded-lg p-1.5 text-[var(--gogo-text-secondary)] transition hover:bg-[var(--gogo-grey-100)] hover:text-[var(--gogo-text-primary)]"
          >
            {item.status === 'ACTIVE'
              ? <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
              : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            }
          </button>
          </Tooltip>
          <Tooltip content="Delete">
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}
            className="rounded-lg p-1.5 text-[var(--gogo-text-secondary)] transition hover:bg-red-50 hover:text-red-600"
          >
            <TrashIcon />
          </button>
          </Tooltip>
        </div>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  /* ── Toolbar ─── */
  const toolbarActions = (
    <div className="flex flex-wrap items-center gap-2">
      <ViewSwitcher view={view} onViewChange={setView} options={viewOptions} />
      <ActionButtons
        actions={[
          {
            key: 'refresh',
            label: 'Refresh',
            icon: <RefreshIcon />,
            variant: 'outline',
            onClick: () => fetchItems(page, searchRef.current, pendingFiltersRef.current, pendingOperatorsRef.current),
          },
          {
            key: 'create',
            label: 'New Division',
            icon: <PlusIcon />,
            onClick: openCreate,
          },
        ]}
      />
    </div>
  );

  /* ── Guards ─── */
  if (!isReady) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-gray-200 border-t-[var(--gogo-primary)]" />
      </div>
    );
  }
  if (!orgId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-[var(--gogo-text-secondary)]">No organization selected.</p>
      </div>
    );
  }

  /* ── Render ─── */
  return (
    <div className="space-y-6">
      <PageHeader title="Divisions" description="Manage organizational divisions and their codes" />

      {/* Stats */}
      <Stats
        columns={3}
        metrics={[
          { label: 'Total Divisions', value: summary.total, icon: <TotalIcon />, color: 'info' },
          { label: 'Active', value: summary.active, icon: <CheckCircleIcon />, color: 'success' },
          { label: 'Inactive', value: summary.inactive, icon: <XCircleIcon />, color: 'error' },
        ]}
      />

      {/* Toolbar + Search */}
      <SearchFilter
        searchPlaceholder="Search by name or code…"
        filters={filterConfigs}
        activeFilters={appliedFilters}
        activeOperators={activeOperators}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        onFilterStateChange={handleFilterStateChange}
        onFilterClear={handleFilterClear}
        onFilterClearAll={handleFilterClearAll}
        onSearchChange={(v) => { searchRef.current = v as string; }}
        storageKey="erp.divisions.searchHistory"
        actions={toolbarActions}
      />

      {hasActiveSearch && !loading && (
        <p className="text-xs text-[var(--gogo-text-secondary)]">
          Showing <strong>{serverTotal}</strong> result{serverTotal !== 1 ? 's' : ''}
        </p>
      )}

      {/* Content */}
      {loading ? (
        <TablePageSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          title="No divisions found"
          description={hasActiveSearch ? 'Try adjusting your search or filters' : 'Get started by creating your first division'}
          icon={<Building2 className="h-8 w-8" />}
          action={!hasActiveSearch ? (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--gogo-primary)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              <PlusIcon /> New Division
            </button>
          ) : undefined}
        />
      ) : view === 'table' ? (
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] shadow-[var(--shadow-card)]">
          <DataTable<Division>
            columns={tableColumns}
            data={items}
            keyExtractor={(item) => item.id}
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={serverTotal}
            pageSize={limit}
            onPageChange={handlePageChange}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <ListView<Division>
            columns={[]}
            data={items}
            keyExtractor={(item) => item.id}
            title={(item) => item.name}
            subtitle={(item) => item.description || item.code}
            leading={(item) => <OrgAvatar name={item.name} size="md" shape="rounded-xl" />}
            trailing={(item) => (
              <div className="flex items-center gap-1">
                <Tooltip content="Edit">
                <button
                  onClick={(e) => { e.stopPropagation(); openEdit(item); }}
                  className="rounded-lg p-1.5 text-[var(--gogo-text-secondary)] transition hover:bg-[var(--gogo-grey-100)] hover:text-[var(--gogo-text-primary)]"
                >
                  <EditIcon />
                </button>
                </Tooltip>
                <Tooltip content="Delete">
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}
                  className="rounded-lg p-1.5 text-[var(--gogo-text-secondary)] transition hover:bg-red-50 hover:text-red-600"
                >
                  <TrashIcon />
                </button>
                </Tooltip>
              </div>
            )}
          />
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] shadow-[var(--shadow-card)]">
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={serverTotal}
              pageSize={limit}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingIdRef.current ? 'Edit Division' : 'New Division'}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-lg border border-[var(--gogo-divider)] px-4 py-2 text-sm font-medium text-[var(--gogo-text-primary)] transition hover:bg-[var(--gogo-grey-100)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={saving}
              className="rounded-lg bg-[var(--gogo-primary)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving…' : editingIdRef.current ? 'Update' : 'Create'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--gogo-text-primary)]">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name')}
              placeholder="e.g. Engineering"
              className="w-full rounded-lg border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] px-3 py-2 text-sm text-[var(--gogo-text-primary)] placeholder:text-[var(--gogo-text-secondary)] focus:border-[var(--gogo-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--gogo-primary)]"
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--gogo-text-primary)]">
              Code <span className="text-red-500">*</span>
            </label>
            <input
              {...register('code')}
              placeholder="e.g. ENG"
              maxLength={50}
              className="w-full rounded-lg border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] px-3 py-2 font-mono text-sm uppercase text-[var(--gogo-text-primary)] placeholder:text-[var(--gogo-text-secondary)] focus:border-[var(--gogo-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--gogo-primary)]"
            />
            {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--gogo-text-primary)]">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Optional description…"
              className="w-full resize-none rounded-lg border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] px-3 py-2 text-sm text-[var(--gogo-text-primary)] placeholder:text-[var(--gogo-text-secondary)] focus:border-[var(--gogo-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--gogo-primary)]"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Division"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Departments under it will become unassigned. This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Toggle Status Confirm */}
      <ConfirmDialog
        open={!!toggleTarget}
        title={toggleTarget?.status === 'ACTIVE' ? 'Deactivate Division' : 'Activate Division'}
        message={
          toggleTarget?.status === 'ACTIVE'
            ? `Deactivate "${toggleTarget?.name}"? It will be hidden from active use.`
            : `Activate "${toggleTarget?.name}"?`
        }
        confirmLabel={toggleTarget?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        loading={toggling}
        variant={toggleTarget?.status === 'ACTIVE' ? 'danger' : 'default'}
        onConfirm={confirmToggle}
        onClose={() => setToggleTarget(null)}
      />
    </div>
  );
}
