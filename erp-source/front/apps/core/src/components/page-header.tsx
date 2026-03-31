'use client';

import { useSetPageTitle } from '@erp/shell';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  useSetPageTitle(title);

  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">{subtitle}</p>}
    </div>
  );
}
