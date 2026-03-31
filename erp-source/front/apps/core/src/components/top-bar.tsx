'use client';

import { useState, useEffect } from 'react';
import { AppSelector, AlertsDropdown, authApi } from '@erp/shell';
import { usePageTitleState } from '../context/page-title';

export function TopBar() {
  const { title, subtitle } = usePageTitleState();
  const [orgName, setOrgName] = useState('');

  useEffect(() => {
    authApi.myOrganizations()
      .then((res: { data?: { data?: Array<{ organizationId?: string; id?: string; name: string }> } }) => {
        const list = res.data?.data || [];
        const storedId = localStorage.getItem('organizationId');
        const current = list.find((o) => (o.organizationId || o.id) === storedId) || list[0];
        if (current?.name) setOrgName(current.name);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="min-w-0 flex-1">
        {title && (
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-white truncate">{title}</h1>
        )}
        {orgName && (
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{orgName}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <AppSelector />
        <AlertsDropdown />
      </div>
    </div>
  );
}
