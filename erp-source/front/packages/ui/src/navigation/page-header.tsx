"use client";

import React from "react";

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export function PageHeader({ title, description, actions, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="mb-6 pt-2">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-2 flex items-center gap-1 text-sm" style={{ color: 'var(--gogo-text-secondary)' }}>
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="mx-1">/</span>}
              {crumb.href ? (
                <a href={crumb.href} className="transition-colors hover:opacity-80" style={{ color: 'var(--gogo-text-secondary)' }}>
                  {crumb.label}
                </a>
              ) : (
                <span className="font-medium" style={{ color: 'var(--gogo-text-primary)' }}>{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--gogo-text-primary)', fontFamily: 'var(--font-gogo)' }}>{title}</h1>
          {description && <p className="mt-1 text-sm" style={{ color: 'var(--gogo-text-secondary)' }}>{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}
