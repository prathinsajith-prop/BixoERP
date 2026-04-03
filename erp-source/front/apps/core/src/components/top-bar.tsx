'use client';

import { AppSelector, AlertsDropdown } from '@erp/shell';
import { usePageTitleState } from '../context/page-title';
import { useOrgContext } from '../context/org';

export function TopBar() {
  const { title } = usePageTitleState();
  const { orgName } = useOrgContext();

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
