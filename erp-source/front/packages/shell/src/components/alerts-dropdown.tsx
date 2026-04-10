'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { notificationsApi } from '../lib/api/notifications';

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}

function formatTimeAgo(dateStr: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const CHANNEL_ICON: Record<string, string> = {
  EMAIL: '📧',
  IN_APP: '🔔',
  PUSH: '📱',
  SMS: '💬',
  WHATSAPP: '💚',
};

interface Notification {
  id: string;
  subject?: string;
  body?: string;
  channel?: string;
  readAt?: string | null;
  sentAt?: string;
  createdAt?: string;
}

export function AlertsDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await notificationsApi.unreadCount();
      setUnreadCount(data?.count ?? 0);
    } catch { /* silently fail */ }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await notificationsApi.list({ limit: 8, offset: 0 });
      setNotifications(Array.isArray(data?.data) ? data.data : []);
    } catch { /* keep existing */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    pollingRef.current = setInterval(fetchUnreadCount, 30000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (open) { fetchNotifications(); fetchUnreadCount(); }
  }, [open, fetchNotifications, fetchUnreadCount]);

  const markRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* silently fail */ }
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.readAt).map((n) => n.id);
    if (unreadIds.length === 0) return;
    try {
      await notificationsApi.batchMarkRead(unreadIds);
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
      setUnreadCount(0);
    } catch { /* silently fail */ }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`relative flex h-11 w-11 items-center justify-center rounded-xl text-gray-600 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm active:scale-95 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white ${open ? 'bg-gray-100 text-gray-900 shadow-sm dark:bg-white/10 dark:text-white' : ''}`}
      >
        <svg className="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)] ring-1 ring-[var(--gogo-divider)] z-50 dark:bg-[var(--gogo-surface)]">
          <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs font-medium transition" style={{ color: 'var(--gogo-primary)' }}>
                  Mark all read
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <svg className="mx-auto h-5 w-5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <svg className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.readAt;
                return (
                  <button
                    key={n.id}
                    onClick={() => { if (isUnread) markRead(n.id); }}
                    className={`flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-left transition hover:bg-gray-50 dark:border-gray-700/50 dark:hover:bg-white/5`}
                    style={isUnread ? { backgroundColor: 'color-mix(in srgb, var(--gogo-primary) 7%, transparent)' } : undefined}
                  >
                    <span className="mt-0.5 text-base">{CHANNEL_ICON[n.channel || ''] || '🔔'}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${isUnread ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                          {n.subject || 'Notification'}
                        </p>
                        {isUnread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: 'var(--gogo-primary)' }} />}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500 line-clamp-2 dark:text-gray-400">{n.body}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="text-xs text-gray-400">{formatTimeAgo(n.sentAt || n.createdAt || '')}</p>
                        <span className="rounded bg-gray-100 px-1.5 py-px text-[9px] font-medium uppercase text-gray-400 dark:bg-gray-700 dark:text-gray-500">
                          {n.channel?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t border-gray-100 px-4 py-2.5 dark:border-gray-700">
            <button
              onClick={() => { setOpen(false); window.location.href = '/notifications'; }}
              className="flex w-full items-center justify-center gap-1.5 text-xs font-semibold transition"
              style={{ color: 'var(--gogo-primary)' }}
            >
              View All Notifications
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
