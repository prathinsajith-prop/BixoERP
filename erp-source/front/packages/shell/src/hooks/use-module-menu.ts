'use client';

import { useState, useEffect } from 'react';
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
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    // 'portal' is the core app itself — it provides its own menu
    const target = moduleId === 'portal' ? '' : moduleId;
    if (!target && moduleId !== 'portal') {
      setItems([]);
      setModuleName('');
      return;
    }

    let cancelled = false;
    setLoading(true);

    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    const url = moduleId === 'portal' ? '/api/menu' : `/${moduleId}/api/menu`;

    fetch(url, { headers })
      .then((res) => {
        if (!res.ok) throw new Error(`Menu fetch failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setItems(data.items ?? []);
          setModuleName(data.moduleName ?? '');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
          setModuleName('');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [moduleId, accessToken]);

  return { items, moduleName, loading };
}
