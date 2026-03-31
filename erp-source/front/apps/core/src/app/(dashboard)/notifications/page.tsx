'use client';

import { useState, useMemo } from 'react';
import PageHeader from '@/components/page-header';

interface Notification {
  id: number;
  type: 'critical' | 'warning' | 'info' | 'success';
  category: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  starred: boolean;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 1, type: 'critical', category: 'system', title: 'Server Health Alert', message: 'Primary database cluster experiencing elevated latency. Auto-failover monitoring is active. Average response time: 450ms (threshold: 200ms).', time: '2 min ago', read: false, starred: false },
  { id: 2, type: 'warning', category: 'security', title: 'Unusual Login Detected', message: 'A login from an unrecognized device was detected for user admin@bixo.dev. Location: São Paulo, Brazil. Please verify this activity.', time: '15 min ago', read: false, starred: true },
  { id: 3, type: 'info', category: 'system', title: 'Scheduled Maintenance', message: 'System maintenance is scheduled for March 15, 2026, 02:00–04:00 UTC. Expected downtime: ~30 minutes for database migration.', time: '1 hr ago', read: false, starred: false },
  { id: 4, type: 'success', category: 'system', title: 'Backup Completed', message: 'Daily automated backup completed successfully. Total size: 2.4 GB. Verified checksums match. Retention policy: 30 days.', time: '3 hrs ago', read: true, starred: false },
  { id: 5, type: 'warning', category: 'billing', title: 'Storage Quota Warning', message: 'Organization storage usage has reached 85% of the allocated quota (8.5 GB / 10 GB). Consider upgrading your plan or cleaning up old files.', time: '5 hrs ago', read: false, starred: false },
  { id: 6, type: 'info', category: 'users', title: 'New Team Member Joined', message: 'Maria Santos has accepted the invitation and joined the Engineering team as a Developer. Assigned default role: member.', time: '6 hrs ago', read: true, starred: false },
  { id: 7, type: 'critical', category: 'security', title: 'Failed Login Attempts', message: '5 consecutive failed login attempts detected for user john@bixo.dev from IP 192.168.1.105. Account temporarily locked for 15 minutes.', time: '8 hrs ago', read: false, starred: true },
  { id: 8, type: 'success', category: 'system', title: 'SSL Certificate Renewed', message: 'SSL certificate for *.bixo.dev has been automatically renewed. New expiry date: March 14, 2027. No action required.', time: '12 hrs ago', read: true, starred: false },
  { id: 9, type: 'info', category: 'users', title: 'Role Updated', message: 'User carlos@bixo.dev has been promoted from member to admin by the organization owner. New permissions are now active.', time: '1 day ago', read: true, starred: false },
  { id: 10, type: 'warning', category: 'system', title: 'API Rate Limit Approaching', message: 'Organization API usage is at 90% of the hourly limit (9,000 / 10,000 requests). Consider implementing request batching.', time: '1 day ago', read: true, starred: false },
  { id: 11, type: 'success', category: 'billing', title: 'Payment Processed', message: 'Monthly subscription payment of $299.00 processed successfully. Invoice #INV-2026-0042 is available for download.', time: '2 days ago', read: true, starred: false },
  { id: 12, type: 'info', category: 'system', title: 'New Feature Available', message: 'Advanced audit logging is now available for your organization. Enable it in Organization Settings → Security to start tracking all admin actions.', time: '2 days ago', read: true, starred: false },
  { id: 13, type: 'critical', category: 'system', title: 'Disk Space Critical', message: 'Log storage volume is at 95% capacity. Automated log rotation has been triggered. Oldest logs older than 7 days will be archived.', time: '3 days ago', read: true, starred: false },
  { id: 14, type: 'info', category: 'users', title: 'User Invitation Sent', message: 'An invitation has been sent to ana@bixo.dev to join the Design team. The invitation will expire in 7 days.', time: '3 days ago', read: true, starred: false },
  { id: 15, type: 'warning', category: 'security', title: '2FA Reminder', message: '3 users in your organization have not enabled two-factor authentication. Consider enforcing 2FA for all admin accounts.', time: '4 days ago', read: true, starred: false },
  { id: 16, type: 'success', category: 'system', title: 'Migration Completed', message: 'Database migration v2.4.0 completed successfully. All tables updated. Zero data loss confirmed. Rollback snapshot retained for 48 hours.', time: '5 days ago', read: true, starred: false },
  { id: 17, type: 'info', category: 'billing', title: 'Plan Upgrade Available', message: 'Based on your current usage, upgrading to the Enterprise plan could save you 15% monthly and unlock advanced security features.', time: '6 days ago', read: true, starred: false },
  { id: 18, type: 'warning', category: 'system', title: 'Deprecated API Version', message: 'API v1 endpoints will be retired on June 1, 2026. Please migrate to v2 before the deadline to avoid service interruption.', time: '1 week ago', read: true, starred: false },
];

const TYPE_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  critical: {
    color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30',
    icon: <svg className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>,
  },
  warning: {
    color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30',
    icon: <svg className="h-5 w-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>,
  },
  info: {
    color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30',
    icon: <svg className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>,
  },
  success: {
    color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    icon: <svg className="h-5 w-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
};

const CATEGORIES = ['all', 'system', 'security', 'users', 'billing'];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [search, setSearch] = useState('');
  const [filterUnread, setFilterUnread] = useState(false);
  const [filterStarred, setFilterStarred] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.message.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterUnread && n.read) return false;
      if (filterStarred && !n.starred) return false;
      if (filterCategory !== 'all' && n.category !== filterCategory) return false;
      if (filterSeverity !== 'all' && n.type !== filterSeverity) return false;
      return true;
    });
  }, [notifications, search, filterUnread, filterStarred, filterCategory, filterSeverity]);

  const grouped = useMemo(() => {
    const groups: Record<string, Notification[]> = {};
    for (const n of filtered) {
      const label = n.time.includes('ago') && (n.time.includes('min') || n.time.includes('hr')) ? 'Today' : n.time.includes('day') ? 'This Week' : 'Older';
      (groups[label] ??= []).push(n);
    }
    return groups;
  }, [filtered]);

  const toggleStar = (id: number) => setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, starred: !n.starred } : n)));
  const toggleRead = (id: number) => setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)));
  const deleteNotification = (id: number) => { setNotifications((prev) => prev.filter((n) => n.id !== id)); setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; }); };
  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const deleteAll = () => setNotifications([]);
  const selectAll = () => setSelected(new Set(filtered.map((n) => n.id)));
  const deselectAll = () => setSelected(new Set());
  const markSelectedRead = () => setNotifications((prev) => prev.map((n) => (selected.has(n.id) ? { ...n, read: true } : n)));
  const deleteSelected = () => { setNotifications((prev) => prev.filter((n) => !selected.has(n.id))); setSelected(new Set()); };
  const toggleSelect = (id: number) => setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" subtitle="Stay updated with alerts and messages" />
      <div className="mb-6 flex items-center justify-end gap-3">
        <span className="text-sm text-gray-500 dark:text-gray-400">{unreadCount} unread · {notifications.length} total</span>
        <button onClick={markAllRead} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Mark All Read</button>
        <button onClick={deleteAll} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30">Delete All</button>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full shrink-0 space-y-4 lg:w-64">
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notifications..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Filters</h3>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" checked={filterUnread} onChange={(e) => setFilterUnread(e.target.checked)} className="rounded border-gray-300 text-blue-600" />
              Unread only
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" checked={filterStarred} onChange={(e) => setFilterStarred(e.target.checked)} className="rounded border-gray-300 text-blue-600" />
              Starred only
            </label>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Category</h3>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setFilterCategory(cat)} className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${filterCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Severity</h3>
            <div className="flex flex-wrap gap-2">
              {['all', 'critical', 'warning', 'info', 'success'].map((sev) => (
                <button key={sev} onClick={() => setFilterSeverity(sev)} className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${filterSeverity === sev ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}>
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main list */}
        <div className="flex-1 space-y-6">
          {selected.size > 0 && (
            <div className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 dark:bg-blue-900/30">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{selected.size} selected</span>
              <button onClick={deselectAll} className="text-xs text-blue-600 underline dark:text-blue-400">Deselect</button>
              <button onClick={markSelectedRead} className="ml-auto rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700">Mark Read</button>
              <button onClick={deleteSelected} className="rounded-lg bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700">Delete</button>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
              <svg className="mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No notifications match your filters.</p>
            </div>
          ) : (
            Object.entries(grouped).map(([label, items]) => (
              <div key={label}>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</h3>
                <div className="space-y-2">
                  {items.map((n) => {
                    const cfg = TYPE_CONFIG[n.type];
                    return (
                      <div key={n.id} className={`group rounded-xl border transition ${!n.read ? 'border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-900/10' : 'border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800'} ${selected.has(n.id) ? 'ring-2 ring-blue-400' : ''}`}>
                        <div className="flex items-start gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpandedId(expandedId === n.id ? null : n.id)}>
                          <input type="checkbox" checked={selected.has(n.id)} onChange={() => toggleSelect(n.id)} onClick={(e) => e.stopPropagation()} className="mt-1 rounded border-gray-300 text-blue-600" />
                          <div className={`mt-0.5 shrink-0 rounded-lg p-1.5 ${cfg.bg}`}>{cfg.icon}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-semibold ${!n.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>{n.title}</p>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${cfg.bg} ${cfg.color}`}>{n.type}</span>
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400 capitalize">{n.category}</span>
                            </div>
                            <p className="mt-0.5 text-xs text-gray-400">{n.time}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={(e) => { e.stopPropagation(); toggleStar(n.id); }} className={`rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700 ${n.starred ? 'text-amber-500' : 'text-gray-400'}`}>
                              <svg className="h-4 w-4" fill={n.starred ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); toggleRead(n.id); }} className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                              {n.read ? (
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51" /></svg>
                              ) : (
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                              )}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                            </button>
                          </div>
                        </div>
                        {expandedId === n.id && (
                          <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-700">
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{n.message}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {filtered.length > 0 && (
            <div className="flex justify-between items-center pt-2">
              <button onClick={selectAll} className="text-xs text-blue-600 hover:underline dark:text-blue-400">Select all {filtered.length}</button>
              <span className="text-xs text-gray-400">{filtered.length} notifications</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
