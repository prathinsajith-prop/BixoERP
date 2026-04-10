'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { List, TableProperties } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { showToast, filesApi } from '@erp/shell';
import { buildSearchParams } from '@erp/shared';
import {
  ActionButtons,
  Avatar,
  Button,
  Chip,
  ConfirmDialog,
  DataTable,
  EmptyState,
  Input,
  ListView,
  Modal,
  PageHeader,
  PageLoadingState,
  TablePageSkeleton,
  Pagination,
  SearchFilter,
  Select,
  Stats,
  StatusBadge,
  ViewSwitcher,
  type ActiveFilters,
  type ActiveOperators,
  type FilterConfig,
  type TableColumn,
  type ViewMode,
} from '@erp/ui';



/* ── SVG icon components ────────────────────────────────────────── */
const Icons = {
  search: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>,
  plus: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
  refresh: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>,
  download: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>,
  filter: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" /></svg>,
  dots: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>,
  eye: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  shield: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
  userToggle: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>,
  trash: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>,
  check: <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>,
  x: <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  xLg: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  users: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
  checkCircle: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  xCircle: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  shieldLg: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
  spinner: <svg className="h-8 w-8 animate-spin text-[var(--gogo-primary)]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>,
  spinnerSm: <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>,
  chevronDown: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>,
};

/* ── Types ──────────────────────────────────────────────────────── */
interface User { id: string; email: string; firstName?: string; lastName?: string; status?: string; isActive?: boolean; roles?: Role[]; createdAt?: string; avatarUrl?: string | null; employeeId?: string | null; }
interface Role { id: string; name: string; description?: string }
interface UserStats { total: number; active: number; inactive: number; }

/* ── Seed / demo data ───────────────────────────────────────────── */
const DEMO_ROLES: Role[] = [
  { id: 'r1', name: 'Admin', description: 'Full system access' },
  { id: 'r2', name: 'Manager', description: 'Team and department management' },
  { id: 'r3', name: 'Accountant', description: 'Financial operations' },
  { id: 'r4', name: 'HR Specialist', description: 'Human resources tasks' },
  { id: 'r5', name: 'Sales Rep', description: 'Sales and CRM' },
  { id: 'r6', name: 'Viewer', description: 'Read-only access' },
];

const SEED_PEOPLE: [string, string][] = [
  ['Emma', 'Johnson'], ['Liam', 'Williams'], ['Olivia', 'Brown'], ['Noah', 'Jones'], ['Ava', 'Garcia'],
  ['Ethan', 'Miller'], ['Sophia', 'Davis'], ['Mason', 'Rodriguez'], ['Isabella', 'Martinez'], ['William', 'Hernandez'],
  ['Mia', 'Lopez'], ['James', 'Gonzalez'], ['Charlotte', 'Wilson'], ['Benjamin', 'Anderson'], ['Amelia', 'Thomas'],
  ['Lucas', 'Taylor'], ['Harper', 'Moore'], ['Henry', 'Jackson'], ['Evelyn', 'Martin'], ['Alexander', 'Lee'],
  ['Abigail', 'Perez'], ['Daniel', 'Thompson'], ['Emily', 'White'], ['Sebastian', 'Harris'], ['Elizabeth', 'Sanchez'],
  ['Jack', 'Clark'], ['Sofia', 'Ramirez'], ['Aiden', 'Lewis'], ['Ella', 'Robinson'], ['Owen', 'Walker'],
  ['Scarlett', 'Young'], ['Matthew', 'Allen'], ['Victoria', 'King'], ['Samuel', 'Wright'], ['Aria', 'Scott'],
  ['David', 'Torres'], ['Grace', 'Nguyen'], ['Joseph', 'Hill'], ['Chloe', 'Flores'], ['Carter', 'Green'],
  ['Penelope', 'Adams'], ['Wyatt', 'Nelson'], ['Layla', 'Baker'], ['John', 'Hall'], ['Riley', 'Rivera'],
  ['Luke', 'Campbell'], ['Zoey', 'Mitchell'], ['Gabriel', 'Carter'], ['Nora', 'Roberts'], ['Julian', 'Gomez'],
  ['Lily', 'Phillips'], ['Leo', 'Evans'], ['Hannah', 'Turner'], ['Jayden', 'Diaz'], ['Lillian', 'Parker'],
  ['Isaac', 'Cruz'], ['Addison', 'Edwards'], ['Lincoln', 'Collins'], ['Ellie', 'Reyes'], ['Theodore', 'Stewart'],
  ['Natalie', 'Morris'], ['Jaxon', 'Morales'], ['Aubrey', 'Murphy'], ['Levi', 'Cook'], ['Savannah', 'Rogers'],
  ['Mateo', 'Gutierrez'], ['Brooklyn', 'Ortiz'], ['Ryan', 'Morgan'], ['Stella', 'Cooper'], ['Nathan', 'Peterson'],
  ['Hazel', 'Bailey'], ['Caleb', 'Reed'], ['Paisley', 'Kelly'], ['Christian', 'Howard'], ['Aurora', 'Ramos'],
  ['Thomas', 'Kim'], ['Violet', 'Cox'], ['Jonathan', 'Ward'], ['Bella', 'Richardson'], ['Hunter', 'Watson'],
  ['Claire', 'Brooks'], ['Eli', 'Chavez'], ['Skylar', 'Wood'], ['Aaron', 'James'], ['Lucy', 'Bennett'],
  ['Landon', 'Gray'], ['Anna', 'Mendoza'], ['Adrian', 'Ruiz'], ['Caroline', 'Hughes'], ['Asher', 'Price'],
  ['Kennedy', 'Alvarez'], ['Grayson', 'Castillo'], ['Madelyn', 'Sanders'], ['Nicholas', 'Patel'], ['Sadie', 'Myers'],
  ['Robert', 'Long'], ['Allison', 'Ross'], ['Colton', 'Foster'], ['Naomi', 'Jimenez'], ['Dominic', 'Powell'],
  ['Elena', 'Jenkins'], ['Connor', 'Perry'], ['Gabriella', 'Russell'], ['Jeremiah', 'Sullivan'], ['Aaliyah', 'Bell'],
];

function generateSeedUsers(): User[] {
  return SEED_PEOPLE.map(([first, last], i) => {
    const email = `${first.toLowerCase()}.${last.toLowerCase()}@acme.com`;
    const id = `usr_${String(i + 1).padStart(4, '0')}`;
    const roleCount = i % 7 === 0 ? 2 : i % 3 === 0 ? 1 : i % 5 === 0 ? 0 : 1;
    const roles = DEMO_ROLES.slice((i * 3) % DEMO_ROLES.length, ((i * 3) % DEMO_ROLES.length) + roleCount);
    const isActive = i % 8 !== 0; // ~12% inactive
    const day = String((i % 28) + 1).padStart(2, '0');
    const month = String((i % 12) + 1).padStart(2, '0');
    return { id, email, firstName: first, lastName: last, isActive, roles, createdAt: `2025-${month}-${day}T10:00:00Z` };
  });
}



/* ── Row action dropdown ────────────────────────────────────────── */
function RowActions({ user, onView, onRoles, onToggleStatus, onDelete }: {
  user: User; onView: () => void; onRoles: () => void; onToggleStatus: () => void; onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({ top: 0, right: 0 });

  // Position the portal dropdown relative to the trigger button
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({
      top: rect.bottom + window.scrollY + 4,
      right: window.innerWidth - rect.right,
    });
  }, [open]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      const target = e.target as Node;
      // Close if clicking outside trigger and outside the portal dropdown
      if (triggerRef.current && !triggerRef.current.contains(target)) {
        const portal = document.getElementById('row-action-portal');
        if (!portal || !portal.contains(target)) setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const items = [
    { label: 'View profile', icon: Icons.eye, onClick: onView },
    { label: 'Manage roles', icon: Icons.shield, onClick: onRoles },
    { label: user.isActive !== false ? 'Deactivate' : 'Activate', icon: Icons.userToggle, onClick: onToggleStatus, danger: user.isActive !== false },
    { label: 'Delete user', icon: Icons.trash, onClick: onDelete, danger: true },
  ];

  const dropdown = open ? createPortal(
    <div
      id="row-action-portal"
      className="fixed z-[9999] w-44 rounded-xl bg-white py-1 shadow-lg ring-1 ring-gray-200/60 dark:bg-gray-900 dark:ring-gray-700"
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

/* ══════════════════════════════════════════════════════════════════
   Main component
   ══════════════════════════════════════════════════════════════════ */
export default function UserManagementPage() {
  const router = useRouter();

  /* ── Data state ─── */
  const [users, setUsers] = useState<User[]>([]);
  const [avatarBlobUrls, setAvatarBlobUrls] = useState<Record<string, string>>({});
  const [roles, setRoles] = useState<Role[]>([]);
  const [serverTotal, setServerTotal] = useState(0);
  const [userStats, setUserStats] = useState<UserStats>({ total: 0, active: 0, inactive: 0 });
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);

  /* ── Filters (controlled by SearchFilterBar) ─── */
  const [search, setSearch] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<ActiveFilters>({});
  const [activeOperators, setActiveOperators] = useState<ActiveOperators>({});

  /**
   * Refs that hold the "pending" filter values so that onSearch callbacks can
   * read the latest values even before React has committed the state update.
   */
  const pendingFiltersRef = useRef<ActiveFilters>({});
  const pendingOperatorsRef = useRef<ActiveOperators>({});
  const searchRef = useRef('');

  const [view, setView] = useState<ViewMode>('table');

  /* ── Selection ─── */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  /* ── Modals ─── */
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [toggleModalOpen, setToggleModalOpen] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [assigning, setAssigning] = useState(false);

  /* ── Add user form ─── */
  const [addForm, setAddForm] = useState({ firstName: '', lastName: '', email: '', password: '', roleId: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  /* ── Portal toast ─── */
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  /* ── Helpers ─── */
  const mapUsers = useCallback((rawList: User[], roleList: Role[]): User[] =>
    rawList.map((u) => ({
      ...u,
      isActive: u.status ? u.status === 'ACTIVE' : u.isActive !== false,
      roles: ((u.roles || []) as (Role | string)[]).map((r) => {
        if (typeof r === 'string') {
          return roleList.find((rl) => rl.id === r) ?? { id: r, name: r };
        }
        return r;
      }),
    })), []);

  /* ── Server-side fetch ─── */
  const fetchUsers = useCallback(async (
    targetPage: number,
    currentSearch: string,
    currentFilters: ActiveFilters,
    currentOperators: ActiveOperators,
    roleList?: Role[],
  ) => {
    setLoading(true);
    try {
      const queryParams = buildSearchParams(
        currentSearch,
        currentFilters,
        currentOperators,
        { page: targetPage, limit: 20 },
      );
      const [usersRes, rolesRes] = await Promise.all([
        authApi.listUsers(queryParams),
        roleList ? Promise.resolve({ data: { data: roleList } }) : authApi.listRoles(),
      ]);
      const data = usersRes.data?.data || usersRes.data;
      const rList: Role[] = roleList ?? (rolesRes as { data?: { data?: Role[] } }).data?.data ?? [];
      const resolvedRoles = rList.length > 0 ? rList : [];
      setRoles(resolvedRoles);
      const list: User[] = data.users || [];
      setUsers(mapUsers(list, resolvedRoles));
      setServerTotal(data.total ?? list.length);
      if (data.summary) {
        setUserStats(data.summary);
      }
    } catch {
      showToast.error('Load failed', 'Could not fetch users.');
      setUsers([]);
      setServerTotal(0);
    } finally { setLoading(false); }
  }, [mapUsers]);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await authApi.listRoles();
      const list = res.data?.data || res.data || [];
      setRoles(list.length > 0 ? list : []);
    } catch { setRoles([]); }
  }, []);

  /* ── Initial load ─── */
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    Promise.all([
      authApi.listUsers({ page: 1, limit: 20 }),
      authApi.listRoles(),
    ])
      .then(([usersRes, rolesRes]) => {
        if (!ignore) {
          const data = usersRes.data?.data || usersRes.data;
          const rList: Role[] = rolesRes.data?.data || rolesRes.data || [];
          const resolvedRoles = rList.length > 0 ? rList : [];
          setRoles(resolvedRoles);
          const list: User[] = data.users || [];
          setUsers(mapUsers(list, resolvedRoles));
          setServerTotal(data.total ?? list.length);
          if (data.summary) setUserStats(data.summary);
        }
      })
      .catch(() => {
        if (!ignore) {
          showToast.error('Load failed', 'Could not fetch users.');
          setUsers([]);
          setServerTotal(0);
          setRoles([]);
        }
      })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Server-side pagination — `users` is already the current page from the API ─── */
  const totalPages = Math.ceil(serverTotal / limit);
  const paginatedUsers = users; // already paged by the backend

  /* ── Avatar blob URLs (authenticated download) ─── */
  useEffect(() => {
    setAvatarBlobUrls({});
    users.forEach((u) => {
      if (!u.avatarUrl) return;
      const match = u.avatarUrl.match(/\/api\/v1\/files\/([^/]+)\/download/);
      if (!match) return;
      filesApi.download(match[1])
        .then((blobUrl) => setAvatarBlobUrls((prev) => ({ ...prev, [u.id]: blobUrl })))
        .catch(() => { });
    });
  }, [users]);

  /* ── Stats (from server summary — always reflects unfiltered tenant totals) ─── */
  const stats = useMemo(() => ({
    total: userStats.total,
    active: userStats.active,
    inactive: userStats.inactive,
    roles: roles.length,
  }), [userStats, roles]);

  /* ── Selection helpers ─── */
  const allSelected = paginatedUsers.length > 0 && paginatedUsers.every((u) => selectedIds.has(u.id));
  const someSelected = selectedIds.size > 0;

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginatedUsers.map((u) => u.id)));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  /* ── Role handlers ─── */
  const handleAssignRole = async (userId: string, roleId: string) => {
    setAssigning(true);
    try {
      await authApi.assignRoleToUser(userId, roleId);
      await fetchUsers(page, searchRef.current, pendingFiltersRef.current, pendingOperatorsRef.current);
      setRoleModalOpen(false);
      setSelectedUser(null);
      showToast.success('Role assigned successfully.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to assign role.';
      showToast.error('Something went wrong', msg);
    } finally { setAssigning(false); }
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    try {
      await authApi.removeRoleFromUser(userId, roleId);
      await fetchUsers(page, searchRef.current, pendingFiltersRef.current, pendingOperatorsRef.current);
      showToast.success('Role removed successfully.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to remove role.';
      showToast.error('Something went wrong', msg);
    }
  };

  /* ── Add user ─── */
  const handleAddUser = async () => {
    if (!addForm.email || !addForm.firstName || !addForm.lastName || !addForm.password) { setAddError('All fields are required'); return; }
    setAddLoading(true); setAddError('');
    try {
      const regRes = await authApi.register({ email: addForm.email, password: addForm.password, firstName: addForm.firstName, lastName: addForm.lastName });
      const newUserId = regRes.data?.data?.id ?? regRes.data?.id;
      if (addForm.roleId && newUserId) {
        try { await authApi.assignRoleToUser(newUserId, addForm.roleId); } catch { /* non-fatal */ }
      }
      await fetchUsers(page, searchRef.current, pendingFiltersRef.current, pendingOperatorsRef.current);
      setAddModalOpen(false);
      setAddForm({ firstName: '', lastName: '', email: '', password: '', roleId: '' });
      showToast.success(`User ${addForm.email} created successfully.`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const text = Array.isArray(msg) ? msg.join(', ') : (msg as string) || 'Failed to create user.';
      setAddError(text);
    } finally { setAddLoading(false); }
  };

  /* ── Delete user ─── */
  const [deleting, setDeleting] = useState(false);
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setDeleting(true);
    const email = selectedUser.email;
    try {
      await authApi.deleteUser(selectedUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      setDeleteModalOpen(false);
      setSelectedUser(null);
      showToast.success(`User ${email} deleted successfully.`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete user.';
      showToast.error('Something went wrong', msg);
      setDeleteModalOpen(false);
      setSelectedUser(null);
    } finally { setDeleting(false); }
  };

  /* ── Activate / Deactivate user ─── */
  const handleToggleActive = (user: User) => {
    setSelectedUser(user);
    setToggleModalOpen(true);
  };

  const confirmToggleActive = async () => {
    if (!selectedUser) return;
    setToggling(true);
    const isCurrentlyActive = selectedUser.isActive !== false;
    try {
      const res = isCurrentlyActive
        ? await authApi.deactivateUser(selectedUser.id)
        : await authApi.activateUser(selectedUser.id);
      const updated = (res as { data?: { data?: User } }).data?.data;
      // Optimistically update user in list
      setUsers((prev) => prev.map((u) =>
        u.id === selectedUser.id
          ? { ...u, status: updated?.status ?? (isCurrentlyActive ? 'INACTIVE' : 'ACTIVE'), isActive: !isCurrentlyActive }
          : u
      ));
      setToggleModalOpen(false);
      setSelectedUser(null);
      const action = isCurrentlyActive ? 'deactivated' : 'activated';
      showToast.success(`User ${selectedUser.email} ${action} successfully.`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? (isCurrentlyActive ? 'Failed to deactivate user.' : 'Failed to activate user.');
      showToast.error('Something went wrong', msg);
      setToggleModalOpen(false);
      setSelectedUser(null);
    } finally { setToggling(false); }
  };

  /* ── Export CSV ─── */
  const handleExport = () => {
    const header = 'Name,Email,Roles,Status\n';
    const rows = users.map((u: User) => {
      const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email?.split('@')[0] || '';
      const roleNames = (u.roles || []).map((r: Role) => r.name).join('; ');
      const status = u.isActive !== false ? 'Active' : 'Inactive';
      return `"${name}","${u.email}","${roleNames}","${status}"`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'users.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Page-change handler (triggers server-side fetch) ─── */
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    fetchUsers(newPage, searchRef.current, pendingFiltersRef.current, pendingOperatorsRef.current);
  }, [fetchUsers]);

  /* ── Search-triggered fetch (called by SearchFilterBar onSearch) ─── */
  const handleSearch = useCallback(() => {
    setPage(1);
    fetchUsers(1, searchRef.current, pendingFiltersRef.current, pendingOperatorsRef.current);
  }, [fetchUsers]);

  /* ── Helpers ─── */
  const getUserRoles = (user: User) => user.roles || [];
  const activeFilterCount = Object.keys(appliedFilters).filter((k) => {
    const v = appliedFilters[k];
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  }).length;

  const clearFilters = () => {
    const empty: ActiveFilters = {};
    const emptyOps: ActiveOperators = {};
    pendingFiltersRef.current = empty;
    pendingOperatorsRef.current = emptyOps;
    searchRef.current = '';
    setAppliedFilters(empty);
    setActiveOperators(emptyOps);
    setSearch('');
    setPage(1);
    fetchUsers(1, '', empty, emptyOps);
  };

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
      key: 'role',
      label: 'Role',
      type: 'multiselect',
      options: roles.map((role) => ({ value: role.id, label: role.name })),
      placeholder: 'Filter by role',
    },
  ], [roles]);

  /**
   * Keep refs in sync so onSearch / handlePageChange can read the latest values
   * without stale closure issues.
   */
  const handleSearchChange = useCallback((value: string) => {
    searchRef.current = value;
    setSearch(value);
  }, []);

  /**
   * Called by SearchFilterBar when the user commits a filter change via the
   * popover "Search" button. We update both ref (for timing safety) and state.
   */
  const handleToolbarFilterStateChange = useCallback((
    key: string,
    state: { value: string | string[]; operator: string },
  ) => {
    pendingFiltersRef.current = { ...pendingFiltersRef.current, [key]: state.value };
    pendingOperatorsRef.current = { ...pendingOperatorsRef.current, [key]: state.operator };
    setAppliedFilters((prev) => ({ ...prev, [key]: state.value }));
    setActiveOperators((prev) => ({ ...prev, [key]: state.operator }));
  }, []);

  const handleToolbarFilterChange = useCallback((key: string, value: string | string[]) => {
    pendingFiltersRef.current = { ...pendingFiltersRef.current, [key]: value };
    setAppliedFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Clearing a single inline chip auto-triggers a fetch so the table updates
   * immediately without requiring the user to click Search again.
   */
  const handleToolbarFilterClear = useCallback((key: string) => {
    const newFilters = { ...pendingFiltersRef.current };
    const newOperators = { ...pendingOperatorsRef.current };
    delete newFilters[key];
    delete newOperators[key];
    pendingFiltersRef.current = newFilters;
    pendingOperatorsRef.current = newOperators;
    setAppliedFilters(newFilters);
    setActiveOperators(newOperators);
    setPage(1);
    fetchUsers(1, searchRef.current, newFilters, newOperators);
  }, [fetchUsers]);

  const selectedKeys = useMemo(() => Array.from(selectedIds), [selectedIds]);
  const hasActiveSearch = !!(search || activeFilterCount > 0);

  const viewOptions = useMemo(
    () => [
      { value: 'table' as ViewMode, label: 'Table view', icon: <TableProperties className="h-4 w-4" /> },
      { value: 'list' as ViewMode, label: 'List view', icon: <List className="h-4 w-4" /> },
    ],
    []
  );

  const toolbarActions = (
    <div className="flex flex-wrap items-center gap-2">
      <ViewSwitcher view={view} onViewChange={setView} options={viewOptions} />
      <ActionButtons
        actions={[
          {
            key: 'refresh-users',
            label: 'Refresh',
            icon: Icons.refresh,
            variant: 'outline',
            onClick: () => {
              fetchUsers(page, searchRef.current, pendingFiltersRef.current, pendingOperatorsRef.current);
              fetchRoles();
            },
          },
          {
            key: 'export-users',
            label: 'Export CSV',
            icon: Icons.download,
            variant: 'outline',
            onClick: handleExport,
          },
          {
            key: 'create-user',
            label: 'Create User',
            icon: Icons.plus,
            onClick: () => setAddModalOpen(true),
          },
        ]}
      />
    </div>
  );

  const tableColumns: TableColumn<User>[] = [
    {
      key: 'user',
      header: 'User',
      render: (user) => {
        const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
        const displayName = name || user.email?.split('@')[0] || 'User';

        return (
          <div className="flex items-center gap-3">
            <Avatar name={name || user.email} src={avatarBlobUrls[user.id]} size="sm" onClick={() => router.push(`/admin/users/${user.id}`)} />
            <div className="min-w-0">
              <button onClick={() => router.push(`/admin/users/${user.id}`)} className="block truncate text-sm font-semibold text-[var(--gogo-text-primary)] transition hover:text-[var(--gogo-primary)]">
                {displayName}
              </button>
              <p className="truncate text-xs text-[var(--gogo-text-secondary)] md:hidden">{user.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'email',
      header: 'Email',
      headerClassName: 'hidden md:table-cell',
      className: 'hidden md:table-cell',
      render: (user) => <span className="text-sm text-[var(--gogo-text-primary)]">{user.email}</span>,
    },
    {
      key: 'roles',
      header: 'Roles',
      headerClassName: 'hidden lg:table-cell',
      className: 'hidden lg:table-cell',
      render: (user) => {
        const userRoles = getUserRoles(user);

        return userRoles.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {userRoles.map((role, index) => (
              <Chip
                key={role.id || role.name || index}
                label={role.name}
                variant="outlined"
                color="primary"
                size="small"
                onDelete={() => handleRemoveRole(user.id, role.id)}
              />
            ))}
          </div>
        ) : <span className="text-xs italic text-[var(--gogo-text-secondary)]">No roles</span>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (user) => (
        <StatusBadge status={user.isActive !== false ? 'ACTIVE' : 'INACTIVE'} label={user.isActive !== false ? 'Active' : 'Inactive'} />
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (user) => (
        <RowActions
          user={user}
          onView={() => router.push(`/admin/users/${user.id}`)}
          onRoles={() => { setSelectedUser(user); setRoleModalOpen(true); }}
          onToggleStatus={() => handleToggleActive(user)}
          onDelete={() => { setSelectedUser(user); setDeleteModalOpen(true); }}
        />
      ),
    },
  ];

  const listColumns: TableColumn<User>[] = [
    {
      key: 'roles',
      header: 'Roles',
      render: (user) => {
        const userRoles = getUserRoles(user);

        return userRoles.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {userRoles.map((role, index) => (
              <Chip
                key={role.id || role.name || index}
                label={role.name}
                variant="outlined"
                color="primary"
                size="small"
              />
            ))}
          </div>
        ) : <span className="text-xs italic text-[var(--gogo-text-secondary)]">No roles</span>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (user) => (
        <StatusBadge status={user.isActive !== false ? 'ACTIVE' : 'INACTIVE'} label={user.isActive !== false ? 'Active' : 'Inactive'} />
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (user) => user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="User Management" description="Manage users, roles, and access" />

      {/* ── Toast (portal to body so fixed positioning isn't broken by parent transforms) ─── */}
      {mounted && toast && createPortal(
        <div role="status" aria-live="polite" className={`fixed right-5 top-5 z-[9999] flex items-center gap-3 rounded-xl px-4 py-3 shadow-xl ring-1 ${toast.type === 'success'
          ? 'bg-white ring-emerald-200 dark:bg-gray-900 dark:ring-emerald-800'
          : 'bg-white ring-red-200 dark:bg-gray-900 dark:ring-red-800'
          }`}>
          {toast.type === 'success'
            ? <svg className="h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            : <svg className="h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          }
          <p className={`text-sm font-medium ${toast.type === 'success' ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'
            }`}>{toast.text}</p>
          <button onClick={() => setToast(null)} className="ml-1 rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>,
        document.body
      )}

      {/* ── Stat cards ─── */}
      <Stats
        columns={4}
        metrics={[
          { label: 'Total Users', value: stats.total, icon: Icons.users, color: 'info' },
          { label: 'Active', value: stats.active, icon: Icons.checkCircle, color: 'success' },
          { label: 'Inactive', value: stats.inactive, icon: Icons.xCircle, color: 'error' },
          { label: 'Roles', value: stats.roles, icon: Icons.shieldLg, color: 'secondary' },
        ]}
      />

      {/* ── Toolbar ─── */}
      <SearchFilter
        searchPlaceholder="Search users by name or email"
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
        storageKey="erp.users.searchHistory"
        actions={toolbarActions}
      />

      {hasActiveSearch && (
        <p className="text-xs text-[var(--gogo-text-secondary)]">
          Showing <strong>{serverTotal}</strong> result{serverTotal !== 1 ? 's' : ''}
        </p>
      )}

      {/* ── Bulk action bar ─── */}
      {someSelected && (
        <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] px-4 py-2.5 shadow-[var(--shadow-card)]">
          <span className="text-sm font-medium text-[var(--gogo-primary)]">{selectedIds.size} selected</span>
          <div className="h-4 w-px bg-[var(--gogo-divider)]" />
          <button onClick={() => setSelectedIds(new Set())} className="text-sm font-medium text-[var(--gogo-primary)] transition hover:opacity-80">
            Deselect all
          </button>
        </div>
      )}

      {/* ── Table ─── */}
      {loading ? (
        <TablePageSkeleton avatarShape="full" />
      ) : paginatedUsers.length === 0 ? (
        <EmptyState
          title="No users found"
          description={hasActiveSearch ? 'Try adjusting your search or filters' : 'Get started by creating a new user'}
          action={!hasActiveSearch ? (
            <Button size="sm" onClick={() => setAddModalOpen(true)}>
              {Icons.plus} Create User
            </Button>
          ) : undefined}
        />
      ) : view === 'table' ? (
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] shadow-[var(--shadow-card)]">
          <DataTable
            columns={tableColumns}
            data={paginatedUsers}
            keyExtractor={(user) => user.id}
            selectable
            selectedKeys={selectedKeys}
            onSelectionChange={(keys) => setSelectedIds(new Set(keys))}
            emptyMessage={hasActiveSearch ? 'No users match your filters' : 'No users found'}
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
          <ListView
            columns={listColumns}
            data={paginatedUsers}
            keyExtractor={(user) => user.id}
            selectable
            selectedKeys={selectedKeys}
            onSelectionChange={(keys) => setSelectedIds(new Set(keys))}
            onRowClick={(user) => router.push(`/admin/users/${user.id}`)}
            title={(user) => [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email?.split('@')[0] || 'User'}
            subtitle={(user) => user.email}
            leading={(user) => {
              const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
              return <Avatar name={name || user.email} src={avatarBlobUrls[user.id]} size="md" />;
            }}
            trailing={(user) => (
              <RowActions
                user={user}
                onView={() => router.push(`/admin/users/${user.id}`)}
                onRoles={() => { setSelectedUser(user); setRoleModalOpen(true); }}
                onToggleStatus={() => handleToggleActive(user)}
                onDelete={() => { setSelectedUser(user); setDeleteModalOpen(true); }}
              />
            )}
            emptyMessage={hasActiveSearch ? 'No users match your filters' : 'No users found'}
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

      {/* ══════════════════════════════════════════════════════════
         Modals
         ══════════════════════════════════════════════════════════ */}

      {/* ── Add User modal ─── */}
      <Modal
        open={addModalOpen}
        onClose={() => { setAddModalOpen(false); setAddError(''); }}
        title="Add New User"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setAddModalOpen(false); setAddError(''); }}>Cancel</Button>
            <Button onClick={handleAddUser} loading={addLoading}>Create User</Button>
          </div>
        }
      >
        {addError && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{addError}</div>
        )}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name" value={addForm.firstName} onChange={(e) => setAddForm((p) => ({ ...p, firstName: e.target.value }))} placeholder="John" />
            <Input label="Last Name" value={addForm.lastName} onChange={(e) => setAddForm((p) => ({ ...p, lastName: e.target.value }))} placeholder="Doe" />
          </div>
          <Input label="Email" type="email" value={addForm.email} onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))} placeholder="john@company.com" />
          <Input label="Password" type="password" value={addForm.password} onChange={(e) => setAddForm((p) => ({ ...p, password: e.target.value }))} placeholder="Min. 8 characters" />
          <Select
            label="Role (optional)"
            value={addForm.roleId}
            onChange={(e) => setAddForm((p) => ({ ...p, roleId: e.target.value }))}
            options={[{ value: '', label: 'Select a role...' }, ...roles.map((r) => ({ value: r.id, label: r.name }))]}
          />
        </div>
      </Modal>

      {/* ── Role management modal ─── */}
      <Modal
        open={roleModalOpen && !!selectedUser}
        onClose={() => { setRoleModalOpen(false); setSelectedUser(null); }}
        title="Manage Roles"
        size="sm"
      >
        {selectedUser && (
          <>
            <p className="mb-4 text-sm text-[var(--gogo-text-secondary)]">
              Assign or remove roles for <span className="font-semibold text-[var(--gogo-text-primary)]">{selectedUser.email}</span>
            </p>
            {getUserRoles(selectedUser).length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--gogo-text-secondary)]">Current Roles</p>
                <div className="flex flex-wrap gap-2">
                  {getUserRoles(selectedUser).map((role) => (
                    <Chip
                      key={role.id || role.name}
                      label={role.name}
                      color="primary"
                      size="small"
                      onDelete={() => handleRemoveRole(selectedUser.id, role.id)}
                    />
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--gogo-text-secondary)]">Available Roles</p>
              <div className="max-h-48 space-y-1.5 overflow-y-auto">
                {roles.filter((r) => !getUserRoles(selectedUser).some((ur) => ur.id === r.id)).map((role) => (
                  <button key={role.id} onClick={() => handleAssignRole(selectedUser.id, role.id)} disabled={assigning}
                    className="flex w-full items-center justify-between rounded-xl border border-[var(--gogo-divider)] px-4 py-3 text-left transition hover:bg-[var(--gogo-grey-100)] disabled:opacity-50">
                    <div>
                      <p className="text-sm font-semibold text-[var(--gogo-text-primary)]">{role.name}</p>
                      {role.description && <p className="mt-0.5 text-xs text-[var(--gogo-text-secondary)]">{role.description}</p>}
                    </div>
                    {Icons.plus}
                  </button>
                ))}
                {roles.filter((r) => !getUserRoles(selectedUser).some((ur) => ur.id === r.id)).length === 0 && (
                  <p className="py-4 text-center text-xs text-[var(--gogo-text-secondary)]">All roles assigned</p>
                )}
              </div>
            </div>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={toggleModalOpen && !!selectedUser}
        onClose={() => { setToggleModalOpen(false); setSelectedUser(null); }}
        onConfirm={confirmToggleActive}
        variant={selectedUser?.isActive !== false ? 'warning' : 'success'}
        title={selectedUser?.isActive !== false ? 'Deactivate User' : 'Activate User'}
        message={selectedUser ? (
          selectedUser.isActive !== false
            ? <>Are you sure you want to deactivate <strong>{selectedUser.email}</strong>? They will lose access immediately.</>
            : <>Are you sure you want to activate <strong>{selectedUser.email}</strong>? They will regain access.</>
        ) : ''}
        confirmLabel={selectedUser?.isActive !== false ? 'Deactivate' : 'Activate'}
        loading={toggling}
      />

      <ConfirmDialog
        open={deleteModalOpen && !!selectedUser}
        onClose={() => { setDeleteModalOpen(false); setSelectedUser(null); }}
        onConfirm={handleDeleteUser}
        variant="danger"
        title="Delete User"
        message={selectedUser ? <>Are you sure you want to delete <strong>{selectedUser.email}</strong>? This action cannot be undone.</> : ''}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
