'use client';

import { useSetPageTitle } from '@erp/shell';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  action?: ReactNode;
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, description, action, actions }: PageHeaderProps) {
  useSetPageTitle(title);
  const desc = description ?? subtitle;
  const actionsNode = actions ?? action;

  return (
    <div className="mb-6 pt-2 flex items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--gogo-text-primary)', fontFamily: 'var(--font-gogo)' }}>{title}</h1>
        {desc && <p className="mt-1 text-sm" style={{ color: 'var(--gogo-text-secondary)' }}>{desc}</p>}
      </div>
      {actionsNode && <div className="flex items-center gap-3 flex-shrink-0">{actionsNode}</div>}
    </div>
  );
}
