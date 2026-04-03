'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import PageHeader from '@/components/page-header';

/* ── Avatar helpers ─────────────────────────────────────────────── */
const AVATAR_COLORS = [
  'from-violet-500 to-purple-600', 'from-blue-500 to-cyan-500', 'from-emerald-500 to-teal-500', 'from-rose-500 to-pink-500',
  'from-amber-500 to-orange-500', 'from-indigo-500 to-blue-600', 'from-fuchsia-500 to-purple-500', 'from-sky-500 to-blue-500',
];

function avatarGradient(str: string) {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string, email: string) {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
  }
  return (email || 'U').substring(0, 2).toUpperCase();
}

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
  spinner: <svg className="h-8 w-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>,
  spinnerSm: <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>,
  chevronDown: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>,
};

/* ── Types ──────────────────────────────────────────────────────── */
interface User { id: string; email: string; firstName?: string; lastName?: string; status?: string; isActive?: boolean; roles?: Role[]; createdAt?: string }
interface Role { id: string; name: string; description?: string }
type StatusFilter = 'all' | 'active' | 'inactive';

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

/* ── Stat card ──────────────────────────────────────────────────── */
function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
}

/* ── Row action dropdown ────────────────────────────────────────── */
function RowActions({ user, onView, onRoles, onToggleStatus, onDelete }: {
  user: User; onView: () => void; onRoles: () => void; onToggleStatus: () => void; onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const items = [
    { label: 'View profile', icon: Icons.eye, onClick: onView },
    { label: 'Manage roles', icon: Icons.shield, onClick: onRoles },
    { label: user.isActive !== false ? 'Deactivate' : 'Activate', icon: Icons.userToggle, onClick: onToggleStatus, danger: user.isActive !== false },
    { label: 'Delete user', icon: Icons.trash, onClick: onDelete, danger: true },
  ];

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300">
        {Icons.dots}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-44 rounded-xl bg-white py-1 shadow-lg ring-1 ring-gray-200/60 dark:bg-gray-900 dark:ring-gray-700">
          {items.map((item) => (
            <button key={item.label} onClick={() => { setOpen(false); item.onClick(); }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800 ${item.danger ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Pagination helper ──────────────────────────────────────────── */
function getPageRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  if (left > 2) pages.push('...');
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push('...');
  pages.push(total);
  return pages;
}

/* ══════════════════════════════════════════════════════════════════
   Main component
   ══════════════════════════════════════════════════════════════════ */
export default function UserManagementPage() {
  const router = useRouter();

  /* ── Data state ─── */
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);

  /* ── Filters ─── */
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [roleFilter, setRoleFilter] = useState('all');

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

  /* ── Toast ─── */
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const showToast = useCallback((type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  }, []);

  /* ── Add user form ─── */
  const [addForm, setAddForm] = useState({ firstName: '', lastName: '', email: '', password: '', roleId: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

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

  /* ── Fetch (falls back to seed data when API is empty) ─── */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        authApi.listUsers({ page: 1, limit: 200 }),
        authApi.listRoles(),
      ]);
      const data = usersRes.data?.data || usersRes.data;
      const rList: Role[] = rolesRes.data?.data || rolesRes.data || [];
      const resolvedRoles = rList.length > 0 ? rList : DEMO_ROLES;
      setRoles(resolvedRoles);
      const list: User[] = data.users || [];
      if (list.length > 0) {
        setUsers(mapUsers(list, resolvedRoles));
        setTotal(list.length);
      } else {
        const seed = generateSeedUsers(); setUsers(seed); setTotal(seed.length);
      }
    } catch {
      const seed = generateSeedUsers(); setUsers(seed); setTotal(seed.length);
    } finally { setLoading(false); }
  }, [mapUsers]);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await authApi.listRoles();
      const list = res.data?.data || res.data || [];
      setRoles(list.length > 0 ? list : DEMO_ROLES);
    } catch { setRoles(DEMO_ROLES); }
  }, []);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    Promise.all([
      authApi.listUsers({ page: 1, limit: 200 }),
      authApi.listRoles(),
    ])
      .then(([usersRes, rolesRes]) => {
        if (!ignore) {
          const data = usersRes.data?.data || usersRes.data;
          const rList: Role[] = rolesRes.data?.data || rolesRes.data || [];
          const resolvedRoles = rList.length > 0 ? rList : DEMO_ROLES;
          setRoles(resolvedRoles);
          const list: User[] = data.users || [];
          if (list.length > 0) {
            setUsers(mapUsers(list, resolvedRoles));
            setTotal(list.length);
          } else {
            const seed = generateSeedUsers(); setUsers(seed); setTotal(seed.length);
          }
        }
      })
      .catch(() => {
        if (!ignore) {
          const seed = generateSeedUsers(); setUsers(seed); setTotal(seed.length);
          setRoles(DEMO_ROLES);
        }
      })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [mapUsers]);

  /* ── Filtering ─── */
  const filteredUsers = useMemo(() => {
    let list = users;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((u) => u.email?.toLowerCase().includes(q) || u.firstName?.toLowerCase().includes(q) || u.lastName?.toLowerCase().includes(q));
    }
    if (statusFilter === 'active') list = list.filter((u) => u.isActive !== false);
    if (statusFilter === 'inactive') list = list.filter((u) => u.isActive === false);
    if (roleFilter !== 'all') list = list.filter((u) => (u.roles || []).some((r) => r.id === roleFilter));
    return list;
  }, [users, search, statusFilter, roleFilter]);

  /* ── Client-side pagination ─── */
  const totalFiltered = filteredUsers.length;
  const totalPages = Math.ceil(totalFiltered / limit);
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredUsers.slice(start, start + limit);
  }, [filteredUsers, page, limit]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, statusFilter, roleFilter]);

  /* ── Stats ─── */
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.isActive !== false).length,
    inactive: users.filter((u) => u.isActive === false).length,
    roles: roles.length,
  }), [users, roles]);

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
      await fetchUsers();
      setRoleModalOpen(false);
      setSelectedUser(null);
      showToast('success', 'Role assigned successfully.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to assign role.';
      showToast('error', msg);
    } finally { setAssigning(false); }
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    try {
      await authApi.removeRoleFromUser(userId, roleId);
      await fetchUsers();
      showToast('success', 'Role removed successfully.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to remove role.';
      showToast('error', msg);
    }
  };

  /* ── Add user ─── */
  const handleAddUser = async () => {
    if (!addForm.email || !addForm.firstName || !addForm.lastName || !addForm.password) { setAddError('All fields are required'); return; }
    setAddLoading(true); setAddError('');
    try {
      await authApi.register({ email: addForm.email, password: addForm.password, firstName: addForm.firstName, lastName: addForm.lastName });
      await fetchUsers();
      setAddModalOpen(false);
      setAddForm({ firstName: '', lastName: '', email: '', password: '', roleId: '' });
      showToast('success', `User ${addForm.email} created successfully.`);
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
      showToast('success', `User ${email} deleted successfully.`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete user.';
      showToast('error', msg);
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
      showToast('success', `User ${selectedUser.email} ${action} successfully.`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? (isCurrentlyActive ? 'Failed to deactivate user.' : 'Failed to activate user.');
      showToast('error', msg);
      setToggleModalOpen(false);
      setSelectedUser(null);
    } finally { setToggling(false); }
  };

  /* ── Export CSV ─── */
  const handleExport = () => {
    const header = 'Name,Email,Roles,Status\n';
    const rows = filteredUsers.map((u) => {
      const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email?.split('@')[0] || '';
      const roleNames = (u.roles || []).map((r) => r.name).join('; ');
      const status = u.isActive !== false ? 'Active' : 'Inactive';
      return `"${name}","${u.email}","${roleNames}","${status}"`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'users.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Helpers ─── */
  const getUserRoles = (user: User) => user.roles || [];
  const activeFilters = (statusFilter !== 'all' ? 1 : 0) + (roleFilter !== 'all' ? 1 : 0);

  const clearFilters = () => { setStatusFilter('all'); setRoleFilter('all'); setSearch(''); };

  return (
    <div className="space-y-6">
      <PageHeader title="User Management" subtitle="Manage users, roles, and access" />

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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Users" value={stats.total} icon={Icons.users} color="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
        <StatCard label="Active" value={stats.active} icon={Icons.checkCircle} color="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
        <StatCard label="Inactive" value={stats.inactive} icon={Icons.xCircle} color="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" />
        <StatCard label="Roles" value={stats.roles} icon={Icons.shieldLg} color="bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" />
      </div>

      {/* ── Toolbar ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: search + filters */}
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative max-w-xs flex-1 sm:max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{Icons.search}</span>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..."
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-blue-500 dark:focus:ring-blue-900/40" />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm font-medium text-gray-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">{Icons.chevronDown}</span>
          </div>

          {/* Role filter */}
          <div className="relative">
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
              className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm font-medium text-gray-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <option value="all">All Roles</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">{Icons.chevronDown}</span>
          </div>

          {activeFilters > 0 && (
            <button onClick={clearFilters} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30">
              {Icons.x}
              Clear filters ({activeFilters})
            </button>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <button onClick={() => { fetchUsers(); fetchRoles(); }} title="Refresh"
            className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 shadow-sm transition hover:bg-gray-50 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
            {Icons.refresh}
          </button>
          <button onClick={handleExport} title="Export CSV"
            className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 shadow-sm transition hover:bg-gray-50 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
            {Icons.download}
          </button>
          <button onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:bg-blue-800">
            {Icons.plus}
            <span className="hidden sm:inline">Add User</span>
          </button>
        </div>
      </div>

      {/* ── Bulk action bar ─── */}
      {someSelected && (
        <div className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-2.5 ring-1 ring-blue-200 dark:bg-blue-900/20 dark:ring-blue-800">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{selectedIds.size} selected</span>
          <div className="h-4 w-px bg-blue-200 dark:bg-blue-700" />
          <button onClick={() => setSelectedIds(new Set())} className="text-sm font-medium text-blue-600 transition hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200">
            Deselect all
          </button>
        </div>
      )}

      {/* ── Table ─── */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
        {loading ? (
          <div className="flex items-center justify-center py-20">{Icons.spinner}</div>
        ) : paginatedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            {Icons.users}
            <p className="mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">No users found</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{search || activeFilters ? 'Try adjusting your search or filters' : 'Get started by adding a new user'}</p>
            {!search && !activeFilters && (
              <button onClick={() => setAddModalOpen(true)} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
                {Icons.plus} Add User
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto max-w-full">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/50">
                  <th className="w-12 px-4 py-3.5">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800" />
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">User</th>
                  <th className="hidden px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 md:table-cell">Email</th>
                  <th className="hidden px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 lg:table-cell">Roles</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                  <th className="w-12 px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {paginatedUsers.map((user) => {
                  const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
                  const displayName = name || user.email?.split('@')[0] || 'User';
                  const userRoles = getUserRoles(user);
                  const isChecked = selectedIds.has(user.id);
                  return (
                    <tr key={user.id} className={`group transition ${isChecked ? 'bg-blue-50/40 dark:bg-blue-900/10' : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/50'}`}>
                      <td className="px-4 py-3.5">
                        <input type="checkbox" checked={isChecked} onChange={() => toggleOne(user.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800" />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(user.email)} text-xs font-bold text-white shadow-sm`}>
                            {getInitials(name, user.email)}
                          </div>
                          <div className="min-w-0">
                            <button onClick={() => router.push(`/admin/users/${user.id}`)} className="block truncate text-sm font-semibold text-gray-900 transition hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
                              {displayName}
                            </button>
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400 md:hidden">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3.5 md:table-cell">
                        <p className="text-sm text-gray-600 dark:text-gray-300">{user.email}</p>
                      </td>
                      <td className="hidden px-4 py-3.5 lg:table-cell">
                        <div className="flex flex-wrap gap-1.5">
                          {userRoles.length > 0 ? userRoles.map((role, rIdx) => (
                            <span key={role.id || role.name || rIdx} className="group/role inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                              {role.name}
                              <button onClick={() => handleRemoveRole(user.id, role.id)} className="ml-0.5 hidden rounded-full p-0.5 text-blue-400 hover:bg-blue-100 hover:text-blue-600 group-hover/role:inline-flex dark:hover:bg-blue-800" title="Remove role">
                                {Icons.x}
                              </button>
                            </span>
                          )) : <span className="text-xs italic text-gray-400 dark:text-gray-500">No roles</span>}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${user.isActive !== false ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${user.isActive !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {user.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <RowActions user={user}
                          onView={() => router.push(`/admin/users/${user.id}`)}
                          onRoles={() => { setSelectedUser(user); setRoleModalOpen(true); }}
                          onToggleStatus={() => handleToggleActive(user)}
                          onDelete={() => { setSelectedUser(user); setDeleteModalOpen(true); }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ─── */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-2 border-t border-gray-100 bg-gray-50/30 px-4 py-3 sm:flex-row dark:border-gray-800 dark:bg-gray-800/30">
            <p className="text-xs text-gray-500 dark:text-gray-400">Showing {(page - 1) * limit + 1}–{Math.min(page * limit, totalFiltered)} of {totalFiltered}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                Previous
              </button>
              {getPageRange(page, totalPages).map((p, i) =>
                p === '...' ? (
                  <span key={`dots-${i}`} className="px-1.5 text-xs text-gray-400">...</span>
                ) : (
                  <button key={p} onClick={() => setPage(p)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${page === p ? 'bg-blue-600 text-white shadow-sm' : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                    {p}
                  </button>
                )
              )}
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
         Modals
         ══════════════════════════════════════════════════════════ */}

      {/* ── Add User modal ─── */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-gray-200/60 dark:bg-gray-900 dark:ring-gray-700">
            <button onClick={() => { setAddModalOpen(false); setAddError(''); }} className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300">
              {Icons.xLg}
            </button>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add New User</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create a new user account</p>

            {addError && (
              <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{addError}</div>
            )}

            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                  <input type="text" value={addForm.firstName} onChange={(e) => setAddForm((p) => ({ ...p, firstName: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="John" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                  <input type="text" value={addForm.lastName} onChange={(e) => setAddForm((p) => ({ ...p, lastName: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Doe" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input type="email" value={addForm.email} onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="john@company.com" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                <input type="password" value={addForm.password} onChange={(e) => setAddForm((p) => ({ ...p, password: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Min. 8 characters" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Role (optional)</label>
                <div className="relative">
                  <select value={addForm.roleId} onChange={(e) => setAddForm((p) => ({ ...p, roleId: e.target.value }))}
                    className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                    <option value="">Select a role...</option>
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">{Icons.chevronDown}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => { setAddModalOpen(false); setAddError(''); }}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button onClick={handleAddUser} disabled={addLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
                {addLoading && Icons.spinnerSm}
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Role management modal ─── */}
      {roleModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-gray-200/60 dark:bg-gray-900 dark:ring-gray-700">
            <button onClick={() => { setRoleModalOpen(false); setSelectedUser(null); }} className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300">
              {Icons.xLg}
            </button>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Manage Roles</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Assign or remove roles for <span className="font-semibold text-gray-700 dark:text-gray-200">{selectedUser.email}</span></p>

            {getUserRoles(selectedUser).length > 0 && (
              <div className="mb-4 mt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Current Roles</p>
                <div className="flex flex-wrap gap-2">
                  {getUserRoles(selectedUser).map((role) => (
                    <span key={role.id || role.name} className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {Icons.check}
                      {role.name}
                      <button onClick={() => handleRemoveRole(selectedUser.id, role.id)} className="ml-1 rounded-full p-0.5 text-blue-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-800">
                        {Icons.x}
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Available Roles</p>
              <div className="max-h-48 space-y-1.5 overflow-y-auto">
                {roles.filter((r) => !getUserRoles(selectedUser).some((ur) => ur.id === r.id)).map((role) => (
                  <button key={role.id} onClick={() => handleAssignRole(selectedUser.id, role.id)} disabled={assigning}
                    className="flex w-full items-center justify-between rounded-xl border border-gray-100 px-4 py-3 text-left transition hover:border-gray-200 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:hover:border-gray-700 dark:hover:bg-gray-800">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{role.name}</p>
                      {role.description && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{role.description}</p>}
                    </div>
                    {Icons.plus}
                  </button>
                ))}
                {roles.filter((r) => !getUserRoles(selectedUser).some((ur) => ur.id === r.id)).length === 0 && (
                  <p className="py-4 text-center text-xs text-gray-400">All roles assigned</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ─── */}
      {/* ── Toggle Active/Inactive confirmation modal ─── */}
      {toggleModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-gray-200/60 dark:bg-gray-900 dark:ring-gray-700">
            <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${selectedUser.isActive !== false ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
              <span className={selectedUser.isActive !== false ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>{Icons.userToggle}</span>
            </div>
            <h3 className="mt-4 text-center text-lg font-bold text-gray-900 dark:text-white">
              {selectedUser.isActive !== false ? 'Deactivate User' : 'Activate User'}
            </h3>
            <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
              {selectedUser.isActive !== false
                ? <>Are you sure you want to deactivate <span className="font-semibold text-gray-700 dark:text-gray-200">{selectedUser.email}</span>? They will lose access immediately.</>
                : <>Are you sure you want to activate <span className="font-semibold text-gray-700 dark:text-gray-200">{selectedUser.email}</span>? They will regain access.</>
              }
            </p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => { setToggleModalOpen(false); setSelectedUser(null); }}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button onClick={confirmToggleActive} disabled={toggling}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${selectedUser.isActive !== false ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}>
                {toggling && Icons.spinnerSm}
                {selectedUser.isActive !== false ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-gray-200/60 dark:bg-gray-900 dark:ring-gray-700">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <span className="text-red-600 dark:text-red-400">{Icons.trash}</span>
            </div>
            <h3 className="mt-4 text-center text-lg font-bold text-gray-900 dark:text-white">Delete User</h3>
            <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete <span className="font-semibold text-gray-700 dark:text-gray-200">{selectedUser.email}</span>? This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => { setDeleteModalOpen(false); setSelectedUser(null); }}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button onClick={handleDeleteUser} disabled={deleting}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60">
                {deleting && Icons.spinnerSm}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
