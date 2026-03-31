'use client';

import { useState, useEffect } from 'react';

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
 * When the portal proxies module frontends, the same URL works.
 */
export function useModuleMenu(moduleId?: string) {
  const [items, setItems] = useState<SidebarMenuItem[]>([]);
  const [moduleName, setModuleName] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!moduleId || moduleId === 'portal') {
      setItems([]);
      setModuleName('');
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/${moduleId}/api/menu`)
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
  }, [moduleId]);

  return { items, moduleName, loading };
}
