"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Alert, LoadingSpinner, EmptyState, PageHeader } from "@erp/ui";
import { api, type Notification } from "../lib/api";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.list();
      setNotifications(res.data);
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.markRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch {
      // ignore
    }
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={`${unread} unread`}
        actions={unread > 0 ? (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        ) : undefined}
      />

      {loading && <LoadingSpinner />}
      {error && <Alert variant="error">{error}</Alert>}

      {!loading && !error && (
        notifications.length === 0 ? (
          <EmptyState
            title="No notifications"
            description="You are all caught up!"
            icon={<Bell className="w-10 h-10 text-gray-300" />}
          />
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.isRead && handleMarkRead(n.id)}
                className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${n.isRead ? "bg-white border-gray-200" : "bg-accent-50 border-accent-200 hover:bg-accent-100"
                  }`}
              >
                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${n.isRead ? "bg-gray-300" : "bg-accent-600"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                <span className="text-xs text-gray-400 capitalize flex-shrink-0">{n.type}</span>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
