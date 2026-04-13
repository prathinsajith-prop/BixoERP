'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/auth';

export interface SidebarMenuItem {
  label: string;
  href: string;
  icon: string;
  /** Permission scope required to access this menu item. */
  permission?: string;
  /** Role IDs that can see this menu item. Empty / omitted = visible to all authenticated users. */
  visibleTo?: string[];
  position?: number;
  children?: SidebarMenuItem[];
}

/**
 * Fetches module menu items from `/${moduleId}/api/menu`.
 * Each module's Next.js app serves its own menu via a route handler.
 * Includes the current JWT in the Authorization header so the route can
 * return permission-filtered nav items appropriate for the current user.
 * When the portal proxies module frontends, the same URL works.
 */
export function useModuleMenu(moduleId?: string) {
  const [items, setItems] = useState<SidebarMenuItem[]>([]);
  const [moduleName, setModuleName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  // Bump to re-fetch when module config changes (e.g. feature flag toggled)
  const [refreshKey, setRefreshKey] = useState(0);
  const accessToken = useAuthStore((s) => s.accessToken);

  // Listen for module-config changes fired by the admin modules page
  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener('erp:module-config-changed', handler);
    window.addEventListener('erp:org-context-changed', handler);
    return () => {
      window.removeEventListener('erp:module-config-changed', handler);
      window.removeEventListener('erp:org-context-changed', handler);
    };
  }, []);

  const doFetch = useCallback(() => {
    // 'portal' is the core app itself — it provides its own menu
    const target = moduleId === 'portal' ? '' : moduleId;
    if (!target && moduleId !== 'portal') {
      setItems([]);
      setModuleName('');
      setLoading(false);
      return () => { };
    }

    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);

    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    const url = moduleId === 'portal' ? '/api/menu' : `/${moduleId}/api/menu`;

    fetch(url, { headers, cache: 'no-store', signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Menu fetch failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setItems(Array.isArray(data?.items) ? data.items : []);
          setModuleName(typeof data?.moduleName === 'string' ? data.moduleName : '');
        }
      })
      .catch((err) => {
        if ((err as { name?: string })?.name === 'AbortError') return;
        if (!cancelled) {
          setItems([]);
          setModuleName('');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [moduleId, accessToken]);

  useEffect(() => {
    const cancel = doFetch();
    return cancel;
    // refreshKey triggers re-fetch on module-config-changed events
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doFetch, refreshKey]);

  return { items, moduleName, loading };
}
